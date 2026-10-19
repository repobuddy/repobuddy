import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { main, RULES, render } from './auto-mode.js'

const dirs: string[] = []
let stdout: string[]
let stderr: string[]
let exitSpy: ReturnType<typeof jest.spyOn>
const originalPath = process.env['PATH']

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
	exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code: number) => {
		throw new Error(`exit ${code}`)
	}) as never)
})

afterEach(() => {
	jest.restoreAllMocks()
	process.env['PATH'] = originalPath
	for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

function tempDir() {
	const d = mkdtempSync(join(tmpdir(), 'auto-mode-'))
	dirs.push(d)
	return d
}

function writeJson(file: string, value: unknown) {
	mkdirSync(join(file, '..'), { recursive: true })
	writeFileSync(file, JSON.stringify(value, null, '\t'))
}

const output = () => JSON.parse(stdout.join(''))

async function run(argv: string[]) {
	await main(argv)
	return output()
}

/** Put a fake `gh` on PATH that answers each call by its full argument list. */
function fakeGh(responses: Record<string, string | { stderr: string }>) {
	const bin = tempDir()
	const table = join(bin, 'responses.json')
	writeFileSync(table, JSON.stringify(responses))
	const script = join(bin, 'gh')
	writeFileSync(
		script,
		`#!/usr/bin/env node
const table = require(${JSON.stringify(table)})
const r = table[process.argv.slice(2).join(' ')]
if (r === undefined) { process.stderr.write('unexpected: ' + process.argv.slice(2).join(' ')); process.exit(1) }
if (typeof r === 'object') { process.stderr.write(r.stderr); process.exit(1) }
process.stdout.write(r)
`,
	)
	chmodSync(script, 0o755)
	process.env['PATH'] = `${bin}${delimiter}${originalPath}`
}

describe('check', () => {
	it('reports the mode, the lists, template text, ignored project blocks, and missing $defaults', async () => {
		const home = tempDir()
		const project = tempDir()
		writeJson(join(home, '.claude', 'settings.json'), {
			permissions: { defaultMode: 'auto' },
			autoMode: {
				environment: ['$defaults', 'Source control: the GitHub organization acme', 'Organization: {COMPANY_NAME}'],
				allow: ['Paths look like `~/code/<repo>`'],
				soft_deny: ['Never touch prod'],
				classifyAllShell: true,
			},
		})
		writeJson(join(project, '.claude', 'settings.local.json'), { autoMode: { allow: ['x'] } })

		const r = await run(['check', '--project', project, '--home', home])
		expect(r.mode.auto).toBe(true)
		expect(r.lists.environment).toEqual({ exists: true, hasDefaults: true, count: 3 })
		expect(r.lists.allow).toEqual({ exists: true, hasDefaults: false, count: 1 })
		expect(r.lists.hard_deny.exists).toBe(false)
		expect(r.classifyAllShell).toBe(true)
		expect(r.templateText).toEqual([
			{ list: 'environment', index: 2, entry: 'Organization: {COMPANY_NAME}', markers: ['{COMPANY_NAME}'] },
		])
		expect(r.ignoredProjectBlocks).toEqual([join(project, '.claude', 'settings.local.json')])
		expect(r.missingDefaults).toEqual(['soft_deny'])
		expect(r.sourceControl).toBe('Source control: the GitHub organization acme')
	})

	it('exits 1 on a settings file that is not JSON', async () => {
		const home = tempDir()
		mkdirSync(join(home, '.claude'))
		writeFileSync(join(home, '.claude', 'settings.json'), '{ not json')
		await expect(main(['check', '--project', tempDir(), '--home', home])).rejects.toThrow('exit 1')
		expect(stderr.join('')).toMatch(/could not parse/)
	})

	it('works with no settings at all', async () => {
		const r = await run(['check', '--project', tempDir(), '--home', tempDir()])
		expect(r.settingsExists).toBe(false)
		expect(r.mode.auto).toBe(false)
		expect(r.sourceControl).toBeNull()
	})
})

describe('discover', () => {
	const repoList = (owner: string) =>
		`repo list ${owner} --limit 1000 --json name,visibility --jq .[] | [.name, .visibility] | @tsv`

	it('proposes the account and admin orgs, summarizes visibility, and reads branch rules and repo signals', async () => {
		fakeGh({
			'api user --jq .login': 'octo-dev\n',
			'api --paginate user/memberships/orgs --jq .[] | [.organization.login, .role, .state] | @tsv':
				'acme\tadmin\tactive\nfriends\tmember\tactive\nlater\tadmin\tpending\n',
			[repoList('octo-dev')]: 'dotfiles\tPRIVATE\nsite\tPUBLIC\nlib\tPUBLIC\n',
			[repoList('acme')]: 'a\tPUBLIC\nb\tPUBLIC\n',
			[repoList('friends')]: 'x\tINTERNAL\n',
			'repo view --json nameWithOwner,defaultBranchRef --jq [.nameWithOwner, .defaultBranchRef.name] | @tsv':
				'octo-dev/site\tmain\n',
			'api repos/octo-dev/site/rules/branches/main': JSON.stringify([
				{ type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'ci' }] } },
				{ type: 'pull_request', parameters: { required_approving_review_count: 0 } },
				{ type: 'merge_queue' },
				{ type: 'non_fast_forward' },
			]),
			'api repos/octo-dev/site/branches/main/protection': { stderr: 'gh: Not Found (HTTP 404)' },
		})
		const home = tempDir()
		const project = tempDir()
		writeJson(join(home, '.claude', 'settings.json'), {
			autoMode: { environment: ['Source control: my namespaces are the GitHub account octo-dev'] },
		})
		writeJson(join(project, 'package.json'), { packageManager: 'pnpm@10.0.0' })
		writeFileSync(join(project, 'pnpm-lock.yaml'), '')
		writeJson(join(project, '.changeset', 'config.json'), {})
		mkdirSync(join(project, '.github', 'workflows'), { recursive: true })
		writeFileSync(join(project, '.github', 'workflows', 'release.yml'), 'uses: changesets/action@v1\n')
		writeFileSync(join(project, '.github', 'workflows', 'ci.yml'), 'run: pnpm test\n')

		const r = await run(['discover', '--project', project, '--home', home])
		expect(r.login).toBe('octo-dev')
		expect(r.namespaces.map((ns: { owner: string; proposed: boolean }) => [ns.owner, ns.proposed])).toEqual([
			['octo-dev', true],
			['acme', true],
			['friends', false],
			['later', false],
		])
		expect(r.namespaces[0].visibility).toEqual({ summary: 'mixed', public: ['site', 'lib'], private: ['dotfiles'] })
		expect(r.namespaces[1].visibility.summary).toBe('public')
		expect(r.namespaces[2].visibility).toEqual({ summary: 'private', public: [], private: ['x'] })
		expect(r.namespaces[3].visibility).toBeUndefined()
		expect(r.branch).toEqual({
			repo: 'octo-dev/site',
			defaultBranch: 'main',
			requiredChecks: ['ci'],
			requiredReviews: 0,
			mergeQueue: true,
			forcePushBlocked: true,
			classicProtection: 'none',
		})
		expect(r.repo).toEqual({
			packageManager: 'pnpm',
			lockfiles: ['pnpm-lock.yaml'],
			changesets: true,
			publishWorkflows: ['.github/workflows/release.yml'],
		})
		expect(r.refresh.missing).toEqual(['acme'])
		expect(r.errors).toEqual([])
	})

	it('reports a missing read:org scope and a non-GitHub repo without failing', async () => {
		fakeGh({
			'api user --jq .login': 'octo-dev\n',
			'api --paginate user/memberships/orgs --jq .[] | [.organization.login, .role, .state] | @tsv': {
				stderr: 'HTTP 403',
			},
			[repoList('octo-dev')]: '',
			'repo view --json nameWithOwner,defaultBranchRef --jq [.nameWithOwner, .defaultBranchRef.name] | @tsv': {
				stderr: 'none of the git remotes point to a known GitHub host',
			},
		})
		const r = await run(['discover', '--project', tempDir(), '--home', tempDir()])
		expect(r.namespaces).toHaveLength(1)
		expect(r.namespaces[0].visibility.summary).toBe('empty')
		expect(r.errors[0]).toMatch(/read:org/)
		expect(r.branch).toBeNull()
		expect(r.refresh.missing).toBeNull()
	})

	it('reads classic branch protection, and says when it cannot', async () => {
		const view = 'repo view --json nameWithOwner,defaultBranchRef --jq [.nameWithOwner, .defaultBranchRef.name] | @tsv'
		const base = {
			'api user --jq .login': 'octo-dev\n',
			'api --paginate user/memberships/orgs --jq .[] | [.organization.login, .role, .state] | @tsv': '',
			[repoList('octo-dev')]: { stderr: 'HTTP 502' },
			[view]: 'octo-dev/site\tmain\n',
			'api repos/octo-dev/site/rules/branches/main': '[]',
		}
		fakeGh({
			...base,
			'api repos/octo-dev/site/branches/main/protection': JSON.stringify({
				required_status_checks: { contexts: ['ci'], checks: [{ context: 'ci' }, { context: 'lint' }] },
				required_pull_request_reviews: { required_approving_review_count: 1 },
				allow_force_pushes: { enabled: false },
			}),
		})
		const r = await run(['discover', '--project', tempDir(), '--home', tempDir()])
		expect(r.branch).toMatchObject({
			requiredChecks: ['ci', 'lint'],
			requiredReviews: 1,
			forcePushBlocked: true,
			classicProtection: 'present',
		})
		expect(r.namespaces[0].visibility).toBeUndefined()
		expect(r.errors[0]).toMatch(/gh repo list octo-dev failed/)

		stdout = []
		fakeGh({ ...base, 'api repos/octo-dev/site/branches/main/protection': { stderr: 'gh: Forbidden (HTTP 403)' } })
		const forbidden = await run(['discover', '--project', tempDir(), '--home', tempDir()])
		expect(forbidden.branch.classicProtection).toBe('unreadable')
	})

	it('exits 1 when gh is not logged in', async () => {
		fakeGh({ 'api user --jq .login': { stderr: 'not logged in' } })
		await expect(main(['discover', '--project', tempDir(), '--home', tempDir()])).rejects.toThrow('exit 1')
		expect(stderr.join('')).toMatch(/not logged in/)
	})
})

describe('render', () => {
	const namespaces = [
		{
			owner: 'octo-dev',
			kind: 'user',
			visibility: { summary: 'mixed', public: ['a', 'b', 'c'], private: ['dotfiles', 'notes'] },
		},
		{ owner: 'acme', kind: 'org', visibility: { summary: 'public', public: ['x'], private: [] } },
		{ owner: 'acme-labs', kind: 'org', visibility: { summary: 'mixed', public: ['site'], private: ['p', 'q'] } },
		{ owner: 'empty', kind: 'org', visibility: { summary: 'empty', public: [], private: [] } },
	]

	it('writes one namespace entry and a visibility entry that refers to it', () => {
		const r = render({ namespaces })
		expect(r.environment).toEqual([
			'Source control: my namespaces, which other entries and rules refer to by that name, are the GitHub account octo-dev and the GitHub organizations acme, acme-labs, and empty, and every repo under them.',
			'Repository visibility: in my namespaces, in octo-dev, the repos dotfiles and notes are private and the rest are public; every repo in acme is public; in acme-labs, the repo site is public and the rest are private.',
		])
		expect(r.allow).toEqual([])
		expect(r.deny).toEqual([])
	})

	it('labels the answered entries and leaves out the unanswered ones', () => {
		const r = render({
			namespaces: [{ owner: 'acme', kind: 'org' }],
			branchProtection: 'the default branch requires the check "ci".',
			toolchain: 'Toolchain: Node.js with pnpm.',
			hostContainment: '  ',
		})
		expect(r.environment).toEqual([
			'Source control: my namespaces, which other entries and rules refer to by that name, are the GitHub organization acme, and every repo under them.',
			'Branch protection: the default branch requires the check "ci".',
			'Toolchain: Node.js with pnpm.',
		])
	})

	it('adds each rule the user asked for with the deny entries it needs', () => {
		const r = render({ namespaces, rules: { merge: true, queuedMerge: true, forceWithLease: true } })
		expect(r.allow).toEqual([RULES.merge.text, RULES.queuedMerge.text, RULES.forceWithLease.text])
		for (const text of r.allow) expect(text).toContain('repo in my namespaces')
		expect(r.deny).toContain('Bash(gh pr merge --admin*)')
		expect(r.deny).toContain('Bash(git push --force *)')
		expect(r.deny.filter((d) => d === 'Bash(gh pr merge --admin*)')).toHaveLength(1)
		expect(r.deny.some((d) => d.includes('force-with-lease'))).toBe(false)
	})

	it('rejects answers without namespaces', async () => {
		const file = join(tempDir(), 'answers.json')
		writeJson(file, { namespaces: [] })
		await expect(main(['render', file])).rejects.toThrow('exit 1')
		expect(stderr.join('')).toMatch(/namespaces/)
	})
})

describe('apply', () => {
	function entriesFile(value: unknown) {
		const file = join(tempDir(), 'entries.json')
		writeJson(file, value)
		return file
	}

	it('prints the change without writing unless --write is passed', async () => {
		const home = tempDir()
		const r = await run(['apply', entriesFile({ environment: ['Source control: acme'] }), '--home', home])
		expect(r.changed).toBe(true)
		expect(r.wrote).toBe(false)
		expect(r.after.autoMode.environment).toEqual(['$defaults', 'Source control: acme'])
		expect(() => readFileSync(join(home, '.claude', 'settings.json'))).toThrow()
	})

	it('starts a new list with $defaults, appends, skips duplicates, and keeps other keys and indentation', async () => {
		const home = tempDir()
		const settings = join(home, '.claude', 'settings.json')
		writeJson(settings, {
			model: 'opus',
			permissions: { allow: ['Bash(git add *)'], deny: ['Bash(gh pr merge --admin*)'] },
			autoMode: { environment: ['Organization: acme', 'Toolchain: pnpm'] },
		})
		const r = await run([
			'apply',
			entriesFile({
				environment: ['Toolchain: pnpm', 'Source control: acme'],
				allow: [RULES.merge.text],
				deny: RULES.merge.deny,
			}),
			'--home',
			home,
			'--write',
		])
		expect(r.wrote).toBe(true)
		expect(r.added).toEqual({
			environment: ['Source control: acme'],
			allow: [RULES.merge.text],
			deny: ['Bash(gh pr merge * --admin*)'],
		})
		expect(r.skipped.environment).toEqual(['Toolchain: pnpm'])
		const text = readFileSync(settings, 'utf8')
		expect(text).toMatch(/^\t"model"/m)
		const back = JSON.parse(text)
		expect(back.model).toBe('opus')
		expect(back.permissions.allow).toEqual(['Bash(git add *)'])
		// An environment list without "$defaults" stays without it: /auto-mode-setup writes it that way.
		expect(back.autoMode.environment).toEqual(['Organization: acme', 'Toolchain: pnpm', 'Source control: acme'])
		expect(back.autoMode.allow).toEqual(['$defaults', RULES.merge.text])
		expect(back.permissions.deny).toEqual(['Bash(gh pr merge --admin*)', 'Bash(gh pr merge * --admin*)'])
	})

	it('replaces an exact entry in place for a refresh, and notes one it cannot find', async () => {
		const home = tempDir()
		const settings = join(home, '.claude', 'settings.json')
		writeJson(settings, { autoMode: { environment: ['$defaults', 'Source control: acme', 'Toolchain: pnpm'] } })
		const r = await run([
			'apply',
			entriesFile({
				replace: [
					{ old: 'Source control: acme', new: 'Source control: acme and acme-labs' },
					{ old: 'gone', new: 'x' },
				],
			}),
			'--home',
			home,
			'--write',
		])
		expect(r.replaced).toEqual([
			{ list: 'environment', old: 'Source control: acme', new: 'Source control: acme and acme-labs' },
		])
		expect(r.notes[0]).toMatch(/gone/)
		expect(JSON.parse(readFileSync(settings, 'utf8')).autoMode.environment).toEqual([
			'$defaults',
			'Source control: acme and acme-labs',
			'Toolchain: pnpm',
		])
	})

	it('writes nothing when every entry is already there', async () => {
		const home = tempDir()
		writeJson(join(home, '.claude', 'settings.json'), { autoMode: { environment: ['$defaults', 'a'] } })
		const r = await run(['apply', entriesFile({ environment: ['a'] }), '--home', home, '--write'])
		expect(r.changed).toBe(false)
		expect(r.wrote).toBe(false)
	})

	it('checks the result with claude auto-mode config when asked', async () => {
		const bin = tempDir()
		writeFileSync(
			join(bin, 'claude'),
			`#!/usr/bin/env node
const s = require(require('path').join(process.env.HOME, '.claude', 'settings.json'))
process.stdout.write(JSON.stringify({ environment: s.autoMode.environment, allow: [] }))
`,
		)
		chmodSync(join(bin, 'claude'), 0o755)
		process.env['PATH'] = `${bin}${delimiter}${originalPath}`
		const home = tempDir()
		const r = await run([
			'apply',
			entriesFile({ environment: ['Source control: acme'] }),
			'--home',
			home,
			'--write',
			'--verify',
		])
		expect(r.verified).toBe(true)
	})

	it('rejects entries that are not string arrays, and a settings file that is not an object', async () => {
		await expect(main(['apply', entriesFile({ allow: [1] }), '--home', tempDir()])).rejects.toThrow('exit 1')
		await expect(main(['apply', entriesFile({ replace: [{ old: 'a' }] }), '--home', tempDir()])).rejects.toThrow(
			'exit 1',
		)
		const home = tempDir()
		writeJson(join(home, '.claude', 'settings.json'), [])
		await expect(main(['apply', entriesFile({ allow: ['x'] }), '--home', home])).rejects.toThrow('exit 1')
	})
})

describe('usage', () => {
	it.each([[[]], [['nope']], [['render']], [['check', 'extra']], [['check', '--home']], [['check', '--bogus']]])(
		'exits 2 for %j',
		async (argv) => {
			await expect(main(argv as string[])).rejects.toThrow('exit 2')
			expect(stderr.join('')).toMatch(/^usage: auto-mode\.mjs/)
			expect(exitSpy).toHaveBeenCalledWith(2)
		},
	)

	it('exits 1 for a missing input file', async () => {
		await expect(main(['render', join(tempDir(), 'missing.json')])).rejects.toThrow('exit 1')
	})
})

describe('rule texts', () => {
	// The references show these rules to the user; the script writes them. Keep them identical.
	const refs = join(import.meta.dirname, '..', '..', 'skills', 'init-buddy', 'references')

	it('match the templates in references/auto-mode.md', () => {
		const doc = readFileSync(join(refs, 'auto-mode.md'), 'utf8')
		expect(doc).toContain(RULES.queuedMerge.text)
		expect(doc).toContain(RULES.forceWithLease.text)
	})

	it('match the GitHub merge rule in references/advanced-tier.md, with the owners as "my namespaces"', () => {
		const doc = readFileSync(join(refs, 'advanced-tier.md'), 'utf8')
		const example = /^"(Merging a pull or merge request \(`gh pr merge`.*)"$/m.exec(doc)?.[1]
		expect(example?.replace(/in a repo owned by the GitHub organizations [^,]+,/, 'in a repo in my namespaces,')).toBe(
			RULES.merge.text,
		)
	})
})
