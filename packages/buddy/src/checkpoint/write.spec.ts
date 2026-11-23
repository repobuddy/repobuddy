import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from '@jest/globals'
import { NotARepoError, parseCheckpoint } from './list.js'
import { checkpointFolder, InvalidCheckpointError, markResumed, validateCheckpoint, writeCheckpoint } from './write.js'

function sh(cwd: string, ...args: string[]) {
	return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function tempDir(prefix: string) {
	return realpathSync(mkdtempSync(join(tmpdir(), prefix)))
}

/** A repo with one commit on `main`, checked out in a folder named `app`, and an empty home folder. */
function makeRepo() {
	const base = tempDir('checkpoint-write-')
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

const TEXT =
	'---\nbranch: main\nupdated: 2026-11-22\n---\n\n# Fix it\n\n## NEXT — resume here\n\nRun it.\n\n## Not in git\n\nnothing\n'

describe('validateCheckpoint', () => {
	it('accepts a checkpoint with front matter, NEXT and Not in git', () => {
		expect(() => validateCheckpoint(TEXT)).not.toThrow()
	})

	it.each([
		['no front matter', '# Fix it\n\n## NEXT\n\nRun it.\n\n## Not in git\n\nnothing\n', /front matter/],
		['an unclosed front matter', '---\nbranch: main\n\n## NEXT\n\n## Not in git\n', /front matter/],
		['no NEXT', '---\nbranch: main\n---\n\n## Not in git\n\nnothing\n', /## NEXT/],
		['no Not in git', '---\nbranch: main\n---\n\n## NEXT\n\nRun it.\n', /## Not in git/],
	])('rejects %s', (_name, text, message) => {
		expect(() => validateCheckpoint(text)).toThrow(message)
	})
})

describe('checkpointFolder', () => {
	it('is the common git dir from a linked worktree too', () => {
		const { base, root, home } = makeRepo()
		const linked = join(base, 'linked')
		sh(root, 'worktree', 'add', '-q', '-b', 'side', linked)
		expect(checkpointFolder({ cwd: linked, home })).toBe(join(root, '.git', 'repobuddy', 'checkpoints'))
	})

	it('is the repo the path is in', () => {
		const { base, root, home } = makeRepo()
		expect(checkpointFolder({ cwd: base, repoPath: 'app', home })).toBe(join(root, '.git', 'repobuddy', 'checkpoints'))
	})

	it('is the home folder with toHome, or outside a repo', () => {
		const { base, root, home } = makeRepo()
		const folder = join(home, '.agents', 'repobuddy', 'checkpoints')
		expect(checkpointFolder({ cwd: root, home, toHome: true })).toBe(folder)
		expect(checkpointFolder({ cwd: base, home })).toBe(folder)
	})

	it('defaults to the repo the current directory is in', () => {
		expect(checkpointFolder()).toBe(
			join(sh(process.cwd(), 'rev-parse', '--path-format=absolute', '--git-common-dir'), 'repobuddy', 'checkpoints'),
		)
	})

	it('throws NotARepoError for a repo path outside a repo', () => {
		const { base, home } = makeRepo()
		expect(() => checkpointFolder({ cwd: base, repoPath: '.', home })).toThrow(NotARepoError)
	})
})

describe('writeCheckpoint', () => {
	it('writes the text to <common dir>/repobuddy/checkpoints/<slug>.md, creating the folder', () => {
		const { root, home } = makeRepo()
		const path = writeCheckpoint({ slug: 'fix-it', content: TEXT, cwd: root, home })
		expect(path).toBe(join(root, '.git', 'repobuddy', 'checkpoints', 'fix-it.md'))
		expect(readFileSync(path, 'utf8')).toBe(TEXT)
		expect(sh(root, 'status', '--porcelain')).toBe('')
	})

	it('replaces an existing checkpoint and ends the file with a newline', () => {
		const { root, home } = makeRepo()
		writeCheckpoint({ slug: 'fix-it', content: TEXT, cwd: root, home })
		const path = writeCheckpoint({
			slug: 'fix-it',
			content: TEXT.replace('Run it.', 'Run it again.').trimEnd(),
			cwd: root,
			home,
		})
		expect(readFileSync(path, 'utf8')).toContain('Run it again.\n\n## Not in git\n\nnothing\n')
	})

	it.each(['Fix-It', 'fix_it', '../fix', 'fix-', ''])('rejects the slug %j', (slug) => {
		const { root, home } = makeRepo()
		expect(() => writeCheckpoint({ slug, content: TEXT, cwd: root, home })).toThrow(InvalidCheckpointError)
	})
})

describe('markResumed', () => {
	const now = new Date('2026-11-22T10:15:00.123Z')

	it('adds the block at the end of the front matter and returns its at', () => {
		const { root, home } = makeRepo()
		const path = writeCheckpoint({ slug: 'fix-it', content: TEXT, cwd: root, home })
		const result = markResumed({
			path,
			harness: 'claude-code',
			session: 's1',
			pid: 42,
			now,
			startOf: () => 'Sun Nov 22 10:00:00 2026',
		})
		expect(result).toEqual({ path, at: '2026-11-22T10:15:00Z' })
		expect(parseCheckpoint(readFileSync(path, 'utf8')).resumed).toEqual({
			at: '2026-11-22T10:15:00Z',
			harness: 'claude-code',
			session: 's1',
			pid: '42',
			started: 'Sun Nov 22 10:00:00 2026',
		})
		expect(readFileSync(path, 'utf8')).toContain('updated: 2026-11-22\nresumed:\n  at: 2026-11-22T10:15:00Z\n')
	})

	it('replaces an older block and keeps the body', () => {
		const { root, home } = makeRepo()
		const old = TEXT.replace(
			'---\n\n#',
			'resumed:\n  at: 2026-01-01T00:00:00Z\n  harness: codex\n  session: old\n---\n\n#',
		)
		const path = writeCheckpoint({ slug: 'fix-it', content: old, cwd: root, home })
		markResumed({ path, harness: 'claude-code', session: 's2', now })
		const text = readFileSync(path, 'utf8')
		expect(text.match(/^resumed:/gm)).toHaveLength(1)
		expect(text).not.toContain('old')
		expect(parseCheckpoint(text).resumed).toEqual({ at: '2026-11-22T10:15:00Z', harness: 'claude-code', session: 's2' })
		expect(text.endsWith('## Not in git\n\nnothing\n')).toBe(true)
	})

	it('leaves started out when the start time cannot be read', () => {
		const { root, home } = makeRepo()
		const path = writeCheckpoint({ slug: 'fix-it', content: TEXT, cwd: root, home })
		markResumed({ path, harness: 'claude-code', session: 's1', pid: 42, now, startOf: () => undefined })
		expect(parseCheckpoint(readFileSync(path, 'utf8')).resumed).toEqual({
			at: '2026-11-22T10:15:00Z',
			harness: 'claude-code',
			session: 's1',
			pid: '42',
		})
	})

	it('reads the start time of a live process with ps, and stamps the current time', () => {
		const { root, home } = makeRepo()
		const path = writeCheckpoint({ slug: 'fix-it', content: TEXT, cwd: root, home })
		const before = Date.now()
		const { at } = markResumed({ path, harness: 'claude-code', session: 's1', pid: process.pid })
		expect(Date.parse(at)).toBeGreaterThanOrEqual(Math.floor(before / 1000) * 1000)
		const resumed = parseCheckpoint(readFileSync(path, 'utf8')).resumed
		expect(resumed?.pid).toBe(String(process.pid))
		expect(resumed?.started).toMatch(/\d{4}$/)
	})

	it('leaves started out for a process that does not exist', () => {
		const { root, home } = makeRepo()
		const path = writeCheckpoint({ slug: 'fix-it', content: TEXT, cwd: root, home })
		markResumed({ path, harness: 'claude-code', session: 's1', pid: 2 ** 22 + 1 })
		expect(parseCheckpoint(readFileSync(path, 'utf8')).resumed?.started).toBeUndefined()
	})

	it('throws for a missing file', () => {
		const { root } = makeRepo()
		expect(() => markResumed({ path: join(root, 'nope.md'), harness: 'h', session: 's' })).toThrow(
			InvalidCheckpointError,
		)
	})
})
