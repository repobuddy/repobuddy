import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from '@jest/globals'
import {
	formatAge,
	formatList,
	listCheckpoints,
	liveness,
	NotARepoError,
	originName,
	type ProcessProbe,
	parseCheckpoint,
} from './list.js'

const NOW = new Date('2026-11-22T12:00:00Z')

function sh(cwd: string, ...args: string[]) {
	return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function tempDir(prefix: string) {
	return realpathSync(mkdtempSync(join(tmpdir(), prefix)))
}

/** A repo with one commit on `main`, checked out in a folder named `app`. */
function makeRepo() {
	const base = tempDir('checkpoint-list-')
	const root = join(base, 'app')
	mkdirSync(root)
	sh(root, 'init', '-q', '-b', 'main')
	sh(root, 'config', 'user.email', 'test@example.com')
	sh(root, 'config', 'user.name', 'test')
	sh(root, 'config', 'commit.gpgsign', 'false')
	writeFileSync(join(root, 'README.md'), 'x\n')
	sh(root, 'add', 'README.md')
	sh(root, 'commit', '-q', '-m', 'init')
	const home = join(base, 'home')
	mkdirSync(home)
	return { base, root, home }
}

function checkpoint(fields: Record<string, string>, title: string, next: string, extra = '') {
	const fm = Object.entries(fields)
		.map(([k, v]) => `${k}: ${v}`)
		.join('\n')
	return `---\n${fm}\n${extra}---\n\n# ${title}\n\n## NEXT — resume here\n\n${next}\n\n## Goal\n\nDone.\n`
}

function write(dir: string, slug: string, text: string) {
	mkdirSync(dir, { recursive: true })
	writeFileSync(join(dir, `${slug}.md`), text)
}

const commonFolder = (root: string) => join(root, '.git', 'repobuddy', 'checkpoints')
const checkoutFolder = (root: string) => join(root, '.agents', 'repobuddy', 'checkpoints')
const homeFolder = (home: string) => join(home, '.agents', 'repobuddy', 'checkpoints')

const neverProbe: ProcessProbe = () => {
	throw new Error('probe should not run')
}

describe('parseCheckpoint', () => {
	it('reads fields, a flow depends-on, the resumed block, the title and the NEXT line', () => {
		const text = checkpoint(
			{ repo: 'acme/app', branch: 'feat/x', updated: '2026-11-20', 'depends-on': '[a, "b"]' },
			'Fix the thing',
			'Run `pnpm test` in packages/x.',
			'resumed:\n  at: 2026-11-21T10:00:00Z      # UTC, now\n  harness: claude-code\n  pid: 42\n',
		)
		const parsed = parseCheckpoint(text)
		expect(parsed.fields).toEqual({ repo: 'acme/app', branch: 'feat/x', updated: '2026-11-20' })
		expect(parsed.dependsOn).toEqual(['a', 'b'])
		expect(parsed.resumed).toEqual({ at: '2026-11-21T10:00:00Z', harness: 'claude-code', pid: '42' })
		expect(parsed.title).toBe('Fix the thing')
		expect(parsed.next).toBe('Run `pnpm test` in packages/x.')
	})

	it('reads a block depends-on list', () => {
		expect(parseCheckpoint('---\ndepends-on:\n  - a\n- b\nbranch: x\n---\n# T\n').dependsOn).toEqual(['a', 'b'])
	})

	it('has no title or NEXT when the body lacks them', () => {
		const parsed = parseCheckpoint('---\nbranch: x\n---\n\nno heading\n')
		expect(parsed.title).toBeUndefined()
		expect(parsed.next).toBeUndefined()
	})
})

describe('originName', () => {
	it.each([
		['git@github.com:acme/app.git', 'acme/app'],
		['https://github.com/acme/app.git', 'acme/app'],
		['https://github.com/acme/app', 'acme/app'],
		['ssh://git@host:22/acme/app.git', 'acme/app'],
		['app', undefined],
	])('%s -> %s', (url, name) => {
		expect(originName(url)).toBe(name)
	})
})

describe('liveness', () => {
	const marker = {
		at: '2026-11-22T09:00:00Z',
		harness: 'claude-code',
		session: 's1',
		pid: '42',
		started: 'Sun Nov 22 08:59:00 2026',
	}
	const opts = (probe: ProcessProbe, committed = false) => ({ committed, now: NOW, probe })

	it('is alive when the pid runs the harness and started at the recorded time', () => {
		const l = liveness(
			marker,
			opts(() => ({ comm: 'claude', started: 'Sun Nov  22 08:59:00 2026' })),
		)
		expect(l).toMatchObject({ state: 'alive', session: 's1', age: '3h' })
	})

	it('is dead when the pid is gone, runs something else, or restarted', () => {
		expect(
			liveness(
				marker,
				opts(() => 'gone'),
			).state,
		).toBe('dead')
		expect(
			liveness(
				marker,
				opts(() => ({ comm: 'bash', started: marker.started })),
			).state,
		).toBe('dead')
		expect(
			liveness(
				marker,
				opts(() => ({ comm: 'claude', started: 'Mon Nov 23 08:59:00 2026' })),
			).state,
		).toBe('dead')
	})

	it('is unknown when it cannot be checked, never dead', () => {
		expect(
			liveness(
				marker,
				opts(() => 'error'),
			).state,
		).toBe('unknown')
		expect(liveness({ ...marker, pid: undefined }, opts(neverProbe)).state).toBe('unknown')
		expect(liveness({ ...marker, started: undefined }, opts(neverProbe)).state).toBe('unknown')
		expect(liveness({ ...marker, harness: 'codex' }, opts(neverProbe)).state).toBe('unknown')
		expect(liveness(marker, opts(neverProbe, true)).state).toBe('unknown')
	})
})

describe('formatAge', () => {
	it('uses minutes, then hours up to two days, then days', () => {
		expect(formatAge(5 * 60_000)).toBe('5m')
		expect(formatAge(47 * 3_600_000)).toBe('47h')
		expect(formatAge(72 * 3_600_000)).toBe('3d')
	})
})

describe('listCheckpoints', () => {
	it('lists the common dir, the checkout and matching home checkpoints, newest updated first', () => {
		const { root, home } = makeRepo()
		write(commonFolder(root), 'older', checkpoint({ branch: 'main', updated: '2026-11-01' }, 'Older', 'Do A.'))
		write(
			checkoutFolder(root),
			'committed',
			checkpoint({ branch: 'main', updated: '2026-11-10' }, 'Committed', 'Do B.'),
		)
		write(
			homeFolder(home),
			'stray',
			checkpoint({ repo: 'app', branch: 'none', updated: '2026-11-15' }, 'Stray', 'Do C.'),
		)
		write(homeFolder(home), 'elsewhere', checkpoint({ repo: 'other/repo', updated: '2026-11-21' }, 'Other', 'Do D.'))

		const list = listCheckpoints({ cwd: root, home, now: NOW, probe: neverProbe })
		expect(list.repo?.root).toBe(root)
		expect(list.checkpoints.map((c) => [c.slug, c.folder])).toEqual([
			['stray', 'home'],
			['committed', 'checkout'],
			['older', 'common'],
		])
		expect(list.checkpoints[0]?.checkedOut).toBeUndefined()
		expect(list.checkpoints[1]).toMatchObject({ branch: 'main', checkedOut: 'here', next: 'Do B.' })
	})

	it('matches a home checkpoint by origin owner/name', () => {
		const { root, home } = makeRepo()
		sh(root, 'remote', 'add', 'origin', 'git@github.com:acme/widget.git')
		write(homeFolder(home), 'mine', checkpoint({ repo: 'acme/widget', updated: '2026-11-15' }, 'Mine', 'Go.'))
		expect(listCheckpoints({ cwd: root, home, now: NOW }).checkpoints.map((c) => c.slug)).toEqual(['mine'])
	})

	it('lists a slug once, from the newest copy, the common dir winning a tie', () => {
		const { root, home } = makeRepo()
		write(commonFolder(root), 'a', checkpoint({ updated: '2026-11-01' }, 'Common A', 'x'))
		write(checkoutFolder(root), 'a', checkpoint({ updated: '2026-11-05' }, 'Checkout A', 'x'))
		write(commonFolder(root), 'b', checkpoint({ updated: '2026-11-05' }, 'Common B', 'x'))
		write(checkoutFolder(root), 'b', checkpoint({ updated: '2026-11-05' }, 'Checkout B', 'x'))

		const rows = listCheckpoints({ cwd: root, home, now: NOW }).checkpoints
		expect(rows.map((r) => [r.slug, r.title, r.olderCopies.map((o) => o.folder)])).toEqual([
			['a', 'Checkout A', ['common']],
			['b', 'Common B', ['checkout']],
		])
	})

	it('names the worktree that holds the branch, and none when no checkout does', () => {
		const { base, root, home } = makeRepo()
		const wt = join(base, 'app-feat')
		sh(root, 'worktree', 'add', '-q', '-b', 'feat', wt)
		write(commonFolder(root), 'feat', checkpoint({ branch: 'feat', updated: '2026-11-02' }, 'Feat', 'x'))
		write(commonFolder(root), 'gone', checkpoint({ branch: 'gone', updated: '2026-11-01' }, 'Gone', 'x'))

		const fromMain = listCheckpoints({ cwd: root, home, now: NOW }).checkpoints
		expect(fromMain.map((r) => r.checkedOut)).toEqual([wt, null])

		const fromWorktree = listCheckpoints({ cwd: wt, home, now: NOW })
		expect(fromWorktree.repo?.mainName).toBe('app')
		expect(fromWorktree.checkpoints.map((r) => r.checkedOut)).toEqual(['here', null])
	})

	it('marks waits on only for a depends-on that still has a checkpoint', () => {
		const { root, home } = makeRepo()
		write(commonFolder(root), 'first', checkpoint({ updated: '2026-11-01' }, 'First', 'x'))
		write(
			commonFolder(root),
			'second',
			checkpoint({ updated: '2026-11-02', 'depends-on': '[first, finished]' }, 'Second', 'x'),
		)
		const second = listCheckpoints({ cwd: root, home, now: NOW }).checkpoints[0]
		expect(second).toMatchObject({ slug: 'second', dependsOn: ['first', 'finished'], waitsOn: ['first'] })
	})

	it('reads a committed marker as unknown without probing', () => {
		const { root, home } = makeRepo()
		const marker = 'resumed:\n  at: 2026-11-22T09:00:00Z\n  harness: claude-code\n  pid: 42\n  started: x\n'
		write(checkoutFolder(root), 'c', checkpoint({ updated: '2026-11-01' }, 'C', 'x', marker))
		sh(root, 'add', '-f', '.agents/repobuddy/checkpoints/c.md')
		sh(root, 'commit', '-q', '-m', 'checkpoint')
		const row = listCheckpoints({ cwd: root, home, now: NOW, probe: neverProbe }).checkpoints[0]
		expect(row?.liveness).toMatchObject({ state: 'unknown', age: '3h' })
	})

	it('probes an uncommitted marker', () => {
		const { root, home } = makeRepo()
		const marker =
			'resumed:\n  at: 2026-11-22T09:00:00Z\n  harness: claude-code\n  session: s9\n  pid: 42\n  started: x\n'
		write(commonFolder(root), 'c', checkpoint({ updated: '2026-11-01' }, 'C', 'x', marker))
		const probe: ProcessProbe = () => ({ comm: 'claude', started: 'x' })
		const row = listCheckpoints({ cwd: root, home, now: NOW, probe }).checkpoints[0]
		expect(row?.liveness).toMatchObject({ state: 'alive', session: 's9' })
	})

	it('probes with ps by default: a live pid running another program is dead, and so is a gone pid', () => {
		const { root, home } = makeRepo()
		const marker = (pid: number) =>
			`resumed:\n  at: 2026-11-22T09:00:00Z\n  harness: claude-code\n  pid: ${pid}\n  started: x\n`
		write(commonFolder(root), 'node', checkpoint({ updated: '2026-11-02' }, 'Node', 'x', marker(process.pid)))
		write(commonFolder(root), 'gone', checkpoint({ updated: '2026-11-01' }, 'Gone', 'x', marker(2 ** 22 + 7)))
		const rows = listCheckpoints({ cwd: root, home, now: NOW }).checkpoints
		expect(rows[0]?.liveness).toMatchObject({ state: 'dead', reason: expect.stringMatching(/^pid \d+ is now /) })
		expect(rows[1]?.liveness?.state).toMatch(/^(dead|unknown)$/)
	})

	it('lists another repo given its path, with here meaning the current checkout only', () => {
		const one = makeRepo()
		const two = makeRepo()
		write(commonFolder(two.root), 'theirs', checkpoint({ branch: 'main', updated: '2026-11-01' }, 'Theirs', 'x'))
		const list = listCheckpoints({ cwd: one.root, repoPath: two.root, home: one.home, now: NOW })
		expect(list.repo?.root).toBe(two.root)
		expect(list.checkpoints[0]).toMatchObject({ slug: 'theirs', checkedOut: two.root })
	})

	it('reads every home checkpoint outside a repo', () => {
		const dir = tempDir('checkpoint-norepo-')
		const home = join(dir, 'home')
		write(homeFolder(home), 'h', checkpoint({ repo: 'any/repo', updated: '2026-11-01' }, 'H', 'x'))
		const list = listCheckpoints({ cwd: dir, home, now: NOW })
		expect(list.repo).toBeNull()
		expect(list.folders.map((f) => f.folder)).toEqual(['home'])
		expect(list.checkpoints.map((c) => c.slug)).toEqual(['h'])
	})

	it('throws NotARepoError for a repo path outside a repo', () => {
		const dir = tempDir('checkpoint-norepo-')
		expect(() => listCheckpoints({ cwd: dir, repoPath: dir, home: dir })).toThrow(NotARepoError)
	})
})

describe('formatList', () => {
	it('says there are none and names the folders', () => {
		const text = formatList({ repo: null, folders: [{ folder: 'home', path: '/h' }], checkpoints: [] })
		expect(text).toBe('No checkpoints in /h.\n')
	})

	it("names each row's repo outside a repo", () => {
		const dir = tempDir('checkpoint-norepo-')
		const home = join(dir, 'home')
		write(homeFolder(home), 'a', checkpoint({ repo: 'acme/app', branch: 'feat', updated: '2026-11-02' }, 'A', 'x'))
		write(homeFolder(home), 'b', checkpoint({ updated: '2026-11-01' }, 'B', 'y'))
		const text = formatList(listCheckpoints({ cwd: dir, home, now: NOW }))
		expect(text).toBe(
			[
				'A (a)',
				'  repo: acme/app',
				'  branch: feat',
				'  updated: 2026-11-02',
				'  next: x',
				`  in ${join(homeFolder(home), 'a.md')}`,
				'B (b)',
				'  repo: none',
				'  updated: 2026-11-01',
				'  next: y',
				`  in ${join(homeFolder(home), 'b.md')}`,
				'',
			].join('\n'),
		)
	})

	it('renders each row', () => {
		const text = formatList({
			repo: { root: '/r', commonDir: '/r/.git', mainName: 'r' },
			folders: [],
			checkpoints: [
				{
					slug: 'a',
					title: 'Fix A',
					path: '/r/.agents/repobuddy/checkpoints/a.md',
					folder: 'checkout',
					branch: 'feat',
					checkedOut: 'here',
					updated: '2026-11-02',
					next: 'Run it.',
					dependsOn: ['b'],
					waitsOn: ['b'],
					liveness: { state: 'unknown', age: '3h', reason: 'no pid or start time' },
					olderCopies: [{ path: '/c/a.md', folder: 'common', updated: '2026-11-01' }],
				},
			],
		})
		expect(text).toBe(
			[
				'Fix A (a)',
				'  branch: feat, here',
				'  updated: 2026-11-02',
				'  next: Run it.',
				'  waits on b',
				'  resumed 3h ago, not paused since: it may be open in another session, or that session ended (no pid or start time)',
				'  in this checkout',
				'  older copy in the common git dir: /c/a.md',
				'',
			].join('\n'),
		)
	})
})
