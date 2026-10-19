import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join } from 'node:path'
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { main, type Result } from './permission-candidates.js'

const tmp = (p: string) => mkdtempSync(join(tmpdir(), `perm-cand-${p}-`))

function project(opts: { remote?: string; pkg?: object; files?: Record<string, string> } = {}): string {
	const dir = tmp('proj')
	execFileSync('git', ['-C', dir, 'init', '-q'])
	if (opts.remote) execFileSync('git', ['-C', dir, 'remote', 'add', 'origin', opts.remote])
	if (opts.pkg) writeFileSync(join(dir, 'package.json'), JSON.stringify(opts.pkg))
	for (const [f, c] of Object.entries(opts.files ?? {})) writeFileSync(join(dir, f), c)
	return dir
}

function fakeBin(names: string[]): string {
	const bin = tmp('bin')
	for (const n of names) {
		writeFileSync(join(bin, n), '#!/bin/sh\n')
		chmodSync(join(bin, n), 0o755)
	}
	return bin
}

let stdout: string[]
let stderr: string[]
const originalPath = process.env['PATH']
const gitDir = dirname(execFileSync('sh', ['-c', 'command -v git'], { encoding: 'utf8' }).trim())

beforeEach(() => {
	stdout = []
	stderr = []
	jest.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
		stdout.push(String(chunk))
		return true
	})
	jest.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
		stderr.push(String(chunk))
		return true
	})
	jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
		throw new Error(`exit:${code}`)
	}) as never)
	// Keep real git reachable; fake managers are added in front per test.
	process.env['PATH'] = originalPath
})

afterEach(() => {
	jest.restoreAllMocks()
	process.env['PATH'] = originalPath
})

async function run(args: string[]): Promise<Result> {
	stdout = []
	await main(args)
	return JSON.parse(stdout.join('')) as Result
}

const allEntries = (r: Result) => [
	...r.allow.safe.map((c) => c.entry),
	...r.allow.goodToHave.map((c) => c.entry),
	...r.deny.flatMap((g) => g.entries.map((c) => c.entry)),
]

test('hosts come from the git remote', async () => {
	const dir = project({ remote: 'git@github.com:acme/widgets.git' })
	const r = await run(['--project', dir, '--home', tmp('home')])
	assert.deepEqual(r.hosts, ['github'])
	assert.ok(r.allow.safe.some((c) => c.entry === 'Bash(gh pr view *)'))
})

test('maps https, azure, and codeberg remotes; ignores unknown hosts', async () => {
	const az = project({ remote: 'https://org@dev.azure.com/org/proj/_git/repo' })
	assert.deepEqual((await run(['--project', az, '--home', tmp('h')])).hosts, ['azure'])
	const cb = project({ remote: 'https://codeberg.org/a/b.git' })
	assert.deepEqual((await run(['--project', cb, '--home', tmp('h')])).hosts, ['forgejo'])
	const other = project({ remote: 'https://git.example.com/a/b.git' })
	assert.deepEqual((await run(['--project', other, '--home', tmp('h')])).hosts, [])
})

test('a directory that is not a git repo has no hosts', async () => {
	const r = await run(['--project', tmp('plain'), '--home', tmp('home')])
	expect(r.hosts).toEqual([])
})

test('--host repeats and overrides the remote', async () => {
	const dir = project({ remote: 'git@github.com:acme/widgets.git' })
	const r = await run(['--project', dir, '--home', tmp('h'), '--host', 'gitlab', '--host', 'gitea'])
	assert.deepEqual(r.hosts, ['gitlab', 'gitea'])
	const all = allEntries(r)
	assert.ok(all.includes('Bash(glab mr view *)'))
	assert.ok(all.includes('Bash(tea pulls list *)'))
	assert.ok(!all.some((e) => e.includes('gh ')))
})

test('a github-only run has no glab, az, tea, or fj entries', async () => {
	const r = await run(['--project', project(), '--home', tmp('h'), '--host', 'github'])
	assert.ok(!allEntries(r).some((e) => /\b(glab|az|tea|fj)\b|glab-cli|forgejo-cli|\.azure|\.config\/tea/.test(e)))
	assert.ok(allEntries(r).includes('Read(~/.config/gh/hosts.yml)'))
	assert.deepEqual(
		r.deny.map((g) => g.group),
		['Force push', 'Bypass merge: GitHub', 'Repo delete', 'API delete', 'Recursive delete', 'Publish', 'Secrets'],
	)
})

test('package scripts appear only when they exist', async () => {
	const dir = project({
		pkg: { packageManager: 'pnpm@9.0.0', scripts: { test: 'x', lint: 'x', format: 'x', 'check:fix': 'x' } },
	})
	const r = await run(['--project', dir, '--home', tmp('h')])
	assert.equal(r.packageManager, 'pnpm')
	const safe = r.allow.safe.map((c) => c.entry)
	assert.deepEqual(safe, ['Bash(pnpm test *)', 'Bash(pnpm lint *)'])
	const good = r.allow.goodToHave.map((c) => c.entry)
	assert.ok(good.includes('Bash(pnpm format *)') && good.includes('Bash(pnpm check:fix *)'))
	assert.ok(!good.includes('Bash(pnpm lint:fix *)'))
})

test('npm uses `npm test` and `npm run <script>`; manager falls back to the lockfile', async () => {
	const dir = project({
		pkg: { scripts: { test: 'x', check: 'x', 'lint:fix': 'x' } },
		files: { 'package-lock.json': '{}' },
	})
	const r = await run(['--project', dir, '--home', tmp('h')])
	assert.equal(r.packageManager, 'npm')
	assert.deepEqual(
		r.allow.safe.map((c) => c.entry),
		['Bash(npm test *)', 'Bash(npm run check *)'],
	)
	assert.ok(r.allow.goodToHave.some((c) => c.entry === 'Bash(npm run lint:fix *)'))
})

test('no package manager means no script entries', async () => {
	const r = await run(['--project', project({ pkg: { scripts: { test: 'x' } } }), '--home', tmp('h')])
	assert.equal(r.packageManager, null)
	assert.deepEqual(r.allow.safe, [])
})

test('no git read commands in the safe tier; git writes are good to have', async () => {
	const r = await run(['--project', project(), '--home', tmp('h'), '--host', 'github'])
	assert.ok(!r.allow.safe.some((c) => c.entry.startsWith('Bash(git ')))
	assert.deepEqual(
		r.allow.goodToHave.map((c) => c.entry),
		['Bash(git add *)', 'Bash(git mv *)', 'Bash(git commit *)', 'Bash(git stash push *)', 'Bash(git stash apply *)'],
	)
})

test('publish and changesets groups follow the managers on PATH and @changesets/cli', async () => {
	const bin = fakeBin(['pnpm', 'yarn'])
	process.env['PATH'] = `${bin}${delimiter}${gitDir}`
	const withCs = project({ pkg: { devDependencies: { '@changesets/cli': '^2' } } })
	const r = await run(['--project', withCs, '--home', tmp('h')])
	const group = (name: string) => r.deny.find((g) => g.group === name)?.entries.map((c) => c.entry)
	assert.ok(group('Publish')?.includes('Bash(pnpm -r publish*)'))
	assert.ok(group('Publish')?.includes('Bash(yarn npm publish*)'))
	assert.ok(!group('Publish')?.includes('Bash(bun publish*)'))
	assert.deepEqual(group('Publish: Changesets'), [
		'Bash(changeset publish*)',
		'Bash(pnpm changeset publish*)',
		'Bash(pnpm exec changeset publish*)',
		'Bash(npx changeset publish*)',
		'Bash(yarn changeset publish*)',
	])
	const without = await run(['--project', project({ pkg: { dependencies: {} } }), '--home', tmp('h')])
	assert.equal(
		without.deny.find((g) => g.group === 'Publish: Changesets'),
		undefined,
	)
})

test('managers missing from PATH are left out', async () => {
	process.env['PATH'] = `${fakeBin([])}${delimiter}${gitDir}`
	const r = await run(['--project', project({ pkg: { dependencies: { '@changesets/cli': '1' } } }), '--home', tmp('h')])
	const all = allEntries(r)
	assert.ok(all.includes('Bash(npm publish*)'))
	assert.ok(!all.some((e) => /pnpm|yarn|bun/.test(e)))
})

test('entries already in settings move to alreadyPresent, with :* equal to " *"', async () => {
	const home = tmp('home')
	mkdirSync(join(home, '.claude'))
	writeFileSync(
		join(home, '.claude', 'settings.json'),
		JSON.stringify({
			env: { TOKEN: 'secret' },
			permissions: { allow: ['Bash(gh pr view:*)'], deny: ['Read(~/.ssh/**)'] },
		}),
	)
	const dir = project({ files: {} })
	mkdirSync(join(dir, '.claude'))
	writeFileSync(
		join(dir, '.claude', 'settings.local.json'),
		JSON.stringify({ permissions: { ask: ['Bash(git commit *)'] } }),
	)
	writeFileSync(join(dir, '.claude', 'settings.json'), 'not json')
	const r = await run(['--project', dir, '--home', home, '--host', 'github'])
	const all = allEntries(r)
	assert.ok(!all.includes('Bash(gh pr view *)'))
	assert.ok(!all.includes('Read(~/.ssh/**)'))
	assert.ok(!all.includes('Bash(git commit *)'))
	assert.deepEqual(
		r.alreadyPresent.map((p) => [p.entry, p.effect]),
		[
			['Bash(gh pr view *)', 'allow'],
			['Bash(git commit *)', 'ask'],
			['Read(~/.ssh/**)', 'deny'],
		],
	)
	assert.ok(!stdout.join('').includes('secret'))
})

test('bad usage exits 2 with a usage line', async () => {
	await expect(main(['--bogus'])).rejects.toThrow('exit:2')
	assert.match(stderr.join(''), /usage: permission-candidates\.mjs/)
	await expect(main(['--host'])).rejects.toThrow('exit:2')
	await expect(main(['--host', 'bitbucket'])).rejects.toThrow('exit:2')
})

// The skill's references carry the same entries as prose for the agent and the user. These two tests
// keep the script and the references from drifting apart: change one, and the other must follow.
const SKILL_DIR = join(import.meta.dirname, '..', '..', 'skills', 'init-buddy')
const backticked = (text: string) => [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]!)

test('the deny groups match the Entries column of references/deny-list.md', async () => {
	const table = readFileSync(join(SKILL_DIR, 'references', 'deny-list.md'), 'utf8')
		.split('## Entries (Claude Code)')[1]!
		.split('\n## ')[0]!
	const documented = new Set(
		table
			.split('\n')
			.filter((line) => line.startsWith('| ') && !/^\| (Group|---)/.test(line))
			.flatMap((line) => {
				const cell = line.split(' | ')[1]!
				const tokens = backticked(cell).filter((token) => /^(Bash|Read)\(/.test(token))
				// The API delete row spells out the `gh api` forms and says "the same four forms for `glab api` and `tea api`".
				const same = /the same four forms for ((?:`\w+ api`(?: and )?)+)/.exec(cell)
				if (!same) return tokens
				const ghForms = tokens.filter((t) => t.startsWith('Bash(gh api '))
				const others = backticked(same[1]!).map((cli) => cli.replace(/ api$/, ''))
				return [...tokens, ...others.flatMap((cli) => ghForms.map((t) => t.replace('Bash(gh ', `Bash(${cli} `)))]
			}),
	)
	process.env['PATH'] = `${fakeBin(['pnpm', 'yarn', 'bun'])}${delimiter}${gitDir}`
	const dir = project({ pkg: { devDependencies: { '@changesets/cli': '*' } } })
	const r = await run(['--project', dir, '--home', tmp('home'), ...HOSTS_ALL.flatMap((h) => ['--host', h])])
	const emitted = new Set(r.deny.flatMap((g) => g.entries.map((c) => c.entry)))
	expect([...emitted].sort()).toEqual([...documented].sort())
})

test('the safe tier host commands match the read-only table in SKILL.md', async () => {
	const skill = readFileSync(join(SKILL_DIR, 'SKILL.md'), 'utf8')
	const documented = skill
		.split('\n')
		.filter((line) => /^\s*\| (GitHub|GitLab|Gitea|Forgejo|Azure DevOps) \| `/.test(line))
		.flatMap((line) => backticked(line))
		.map((cmd) => `Bash(${cmd} *)`)
	const r = await run(['--project', tmp('proj'), '--home', tmp('home'), ...HOSTS_ALL.flatMap((h) => ['--host', h])])
	expect(r.allow.safe.map((c) => c.entry).sort()).toEqual(documented.sort())
})

const HOSTS_ALL = ['github', 'gitlab', 'gitea', 'forgejo', 'azure']
