import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from '@jest/globals'
import { commitCheckpoints, RedactionError, redactionHits } from './commit.js'
import { NotARepoError } from './list.js'
import { InvalidCheckpointError } from './write.js'

function sh(cwd: string, ...args: string[]) {
	return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

const identity = { home: '/srv/people/sam', user: 'samwise', host: 'shire-box' }

function makeRepo() {
	const root = join(realpathSync(mkdtempSync(join(tmpdir(), 'checkpoint-commit-'))), 'app')
	mkdirSync(root)
	sh(root, 'init', '-q', '-b', 'main')
	sh(root, 'config', 'user.email', 'test@example.com')
	sh(root, 'config', 'user.name', 'test')
	sh(root, 'config', 'commit.gpgsign', 'false')
	sh(root, 'config', 'core.hooksPath', '/dev/null')
	writeFileSync(join(root, 'README.md'), 'x\n')
	sh(root, 'add', 'README.md')
	sh(root, 'commit', '-q', '-m', 'init')
	return root
}

function save(root: string, slug: string, body = 'Run it.') {
	const dir = join(root, '.git', 'repobuddy', 'checkpoints')
	mkdirSync(dir, { recursive: true })
	writeFileSync(join(dir, `${slug}.md`), `---\nbranch: main\n---\n\n## NEXT\n\n${body}\n\n## Not in git\n\nnothing\n`)
}

describe('redactionHits', () => {
	it.each([
		['a Linux home path', 'see /home/someone/app'],
		['a macOS home path', 'see /Users/someone/app'],
		['a Windows path', 'see C:\\work\\app'],
		['the home folder', 'see /srv/people/sam/app'],
		['the user name', 'asked samwise'],
		['the host name', 'on shire-box'],
	])('finds %s', (_name, line) => {
		expect(redactionHits('a.md', `ok\n${line}\n`, identity)).toEqual([`a.md:2: ${line}`])
	})

	it('passes a repo-relative path, a word that only contains the name, and an allowed word', () => {
		expect(redactionHits('a.md', 'src/parse.js\nsamwiseish\n', identity)).toEqual([])
		expect(redactionHits('a.md', 'asked samwise', identity, ['samwise'])).toEqual([])
	})
})

describe('commitCheckpoints', () => {
	it('copies the checkpoints into the checkout and commits only them', () => {
		const root = makeRepo()
		save(root, 'fix-it')
		save(root, 'docs')
		writeFileSync(join(root, 'README.md'), 'changed\n')
		writeFileSync(join(root, 'staged.txt'), 'staged\n')
		sh(root, 'add', 'staged.txt')
		const result = commitCheckpoints({ slugs: ['fix-it', 'docs'], cwd: root, identity })
		expect(result.message).toBe('docs: checkpoint fix-it, docs')
		expect(sh(root, 'log', '-1', '--format=%s')).toBe('docs: checkpoint fix-it, docs')
		expect(sh(root, 'show', '--name-only', '--format=', 'HEAD').split('\n').sort()).toEqual([
			'.agents/repobuddy/checkpoints/docs.md',
			'.agents/repobuddy/checkpoints/fix-it.md',
		])
		expect(sh(root, 'diff', '--name-only')).toBe('README.md')
		expect(sh(root, 'diff', '--cached', '--name-only')).toBe('staged.txt')
		expect(result.commit).toBe(sh(root, 'rev-parse', '--short', 'HEAD'))
	})

	it('commits under the message given, for the repo convention', () => {
		const root = makeRepo()
		save(root, 'fix-it')
		const message = 'chore(checkpoint): save fix-it'
		expect(commitCheckpoints({ slugs: ['fix-it'], message: `${message}\n`, cwd: root, identity }).message).toBe(message)
		expect(sh(root, 'log', '-1', '--format=%s')).toBe(message)
	})

	it('rejects an empty message and commits nothing', () => {
		const root = makeRepo()
		save(root, 'fix-it')
		const head = sh(root, 'rev-parse', 'HEAD')
		expect(() => commitCheckpoints({ slugs: ['fix-it'], message: '  ', cwd: root, identity })).toThrow(
			'the commit message is empty',
		)
		expect(sh(root, 'rev-parse', 'HEAD')).toBe(head)
	})

	it('commits copies in an excluded folder', () => {
		const root = makeRepo()
		writeFileSync(join(root, '.git', 'info', 'exclude'), '.agents/\n')
		save(root, 'fix-it')
		commitCheckpoints({ slugs: ['fix-it'], cwd: root, identity })
		expect(sh(root, 'ls-files', '.agents')).toBe('.agents/repobuddy/checkpoints/fix-it.md')
	})

	it('drops a committed copy in the same commit, or alone', () => {
		const root = makeRepo()
		save(root, 'old')
		commitCheckpoints({ slugs: ['old'], cwd: root, identity })
		save(root, 'fix-it')
		commitCheckpoints({ slugs: ['fix-it'], drops: ['old'], cwd: root, identity })
		expect(sh(root, 'show', '--no-renames', '--name-status', '--format=', 'HEAD').split('\n').sort()).toEqual([
			'A\t.agents/repobuddy/checkpoints/fix-it.md',
			'D\t.agents/repobuddy/checkpoints/old.md',
		])
		expect(existsSync(join(root, '.agents', 'repobuddy', 'checkpoints', 'old.md'))).toBe(false)
		const result = commitCheckpoints({ slugs: [], drops: ['fix-it'], cwd: root, identity })
		expect(result.message).toBe('docs: drop checkpoint fix-it')
		expect(sh(root, 'ls-files', '.agents')).toBe('')
	})

	it('commits nothing when a copy would leak a path', () => {
		const root = makeRepo()
		save(root, 'fix-it', 'Open /home/someone/app/x.js.')
		expect(() => commitCheckpoints({ slugs: ['fix-it'], cwd: root, identity })).toThrow(RedactionError)
		expect(sh(root, 'rev-list', '--count', 'HEAD')).toBe('1')
		expect(existsSync(join(root, '.agents'))).toBe(false)
	})

	it.each([
		['nothing named', { slugs: [] }],
		['a missing checkpoint', { slugs: ['nope'] }],
		['a drop that was never committed', { slugs: [], drops: ['nope'] }],
	])('throws InvalidCheckpointError for %s', (_name, opts) => {
		const root = makeRepo()
		expect(() => commitCheckpoints({ ...opts, cwd: root, identity })).toThrow(InvalidCheckpointError)
	})

	it('throws with git output when the commit fails, such as on a rejecting hook', () => {
		const root = makeRepo()
		const hooks = join(root, '..', 'hooks')
		mkdirSync(hooks)
		writeFileSync(join(hooks, 'pre-commit'), '#!/bin/sh\necho rejected >&2\nexit 1\n', { mode: 0o755 })
		sh(root, 'config', 'core.hooksPath', hooks)
		save(root, 'fix-it')
		expect(() => commitCheckpoints({ slugs: ['fix-it'], cwd: root, identity })).toThrow(/git commit failed: rejected/)
	})

	it('checks no home folder when it is unknown', () => {
		expect(redactionHits('a.md', 'see /srv/people/sam', { ...identity, home: '' })).toEqual([])
	})

	it('throws NotARepoError outside a repo', () => {
		const dir = realpathSync(mkdtempSync(join(tmpdir(), 'checkpoint-commit-')))
		expect(() => commitCheckpoints({ slugs: ['x'], cwd: dir, identity })).toThrow(NotARepoError)
	})

	it('reads the identity of the current user by default', () => {
		const root = makeRepo()
		save(root, 'fix-it')
		expect(commitCheckpoints({ slugs: ['fix-it'], cwd: root }).message).toBe('docs: checkpoint fix-it')
		expect(readFileSync(join(root, '.agents', 'repobuddy', 'checkpoints', 'fix-it.md'), 'utf8')).toContain('Run it.')
	})
})
