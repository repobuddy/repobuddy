import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { detectState } from './detect-state.js'
import type { Exec } from './exec.js'

let dir: string
let out: string

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'detect-state-repo-'))
	out = join(mkdtempSync(join(tmpdir(), 'detect-state-out-')), 'state.json')
})

afterEach(() => {
	rmSync(dir, { recursive: true, force: true })
})

function fakeExec(responses: Record<string, string>): Exec {
	return {
		run: (cmd) => {
			for (const [pattern, response] of Object.entries(responses)) {
				if (cmd.includes(pattern)) return response
			}
			throw new Error(`unexpected command: ${cmd}`)
		},
	}
}

describe('detectState', () => {
	it('writes the state artifact and reports counts for a minimally-configured repo', () => {
		writeFileSync(join(dir, 'package.json'), '{}')
		writeFileSync(join(dir, 'pnpm-lock.yaml'), '')
		mkdirSync(join(dir, 'src'))
		writeFileSync(join(dir, 'src', 'index.ts'), '')

		const exec = fakeExec({
			nameWithOwner: 'octo/repo',
			defaultBranchRef: 'main',
			'repos/octo/repo/rulesets': '[]',
			'repos/octo/repo': '{}',
		})

		const { ack, state } = detectState({ dir, out, exec })

		expect(ack.ok).toBe(true)
		expect(ack.artifact).toBe(out)
		expect(ack.repo).toBe('octo/repo')
		expect(ack.defaultBranch).toBe('main')
		expect(ack.counts.willSet + ack.counts.alreadySet).toBe(state.rows.length)
		expect(state.detected.packageManager).toBe('pnpm')
		expect(state.detected.language).toBe('typescript')
		expect(state.detected.codeqlLanguage).toBe('javascript')
		expect(state.detected.hasPackageJson).toBe(true)
		expect(existsSync(out)).toBe(true)
		expect(JSON.parse(readFileSync(out, 'utf8'))).toEqual(state)
	})

	it('reflects an already-configured repo and an existing default-branch ruleset', () => {
		const exec = fakeExec({
			nameWithOwner: 'octo/repo',
			defaultBranchRef: 'main',
			// The list endpoint omits `conditions`; only the per-ruleset endpoint returns them.
			'repos/octo/repo/rulesets/7': JSON.stringify({
				id: 7,
				name: 'default-branch-protection',
				target: 'branch',
				enforcement: 'active',
				conditions: { ref_name: { include: ['~DEFAULT_BRANCH'] } },
			}),
			'repos/octo/repo/rulesets': JSON.stringify([
				{ id: 7, name: 'default-branch-protection', target: 'branch', enforcement: 'active' },
			]),
			'rules/branches/main': JSON.stringify([{ type: 'merge_queue', parameters: {} }]),
			'repos/octo/repo': JSON.stringify({
				delete_branch_on_merge: true,
				allow_auto_merge: true,
				allow_merge_commit: true,
				allow_squash_merge: false,
				allow_rebase_merge: false,
				allow_update_branch: true,
				security_and_analysis: { dependabot_security_updates: { status: 'enabled' } },
			}),
		})

		const { ack, state } = detectState({ dir, out, exec })

		expect(ack.counts.willSet).toBe(0)
		expect(state.current.defaultBranchRuleset).toEqual({ id: 7, name: 'default-branch-protection' })
	})

	it('detects other package managers and no detectable language', () => {
		writeFileSync(join(dir, 'package-lock.json'), '')
		const exec = fakeExec({
			nameWithOwner: 'octo/repo',
			defaultBranchRef: 'main',
			'repos/octo/repo/rulesets': '[]',
			'repos/octo/repo': '{}',
		})
		const { state } = detectState({ dir, out, exec })
		expect(state.detected.packageManager).toBe('npm')
		expect(state.detected.language).toBeNull()
		expect(state.detected.codeqlLanguage).toBeNull()
	})

	it('detects bun and yarn lockfiles', () => {
		writeFileSync(join(dir, 'bun.lock'), '')
		const exec = fakeExec({
			nameWithOwner: 'octo/repo',
			defaultBranchRef: 'main',
			'repos/octo/repo/rulesets': '[]',
			'repos/octo/repo': '{}',
		})
		expect(detectState({ dir, out, exec }).state.detected.packageManager).toBe('bun')

		const dir2 = mkdtempSync(join(tmpdir(), 'detect-state-repo2-'))
		try {
			writeFileSync(join(dir2, 'yarn.lock'), '')
			expect(detectState({ dir: dir2, out, exec }).state.detected.packageManager).toBe('yarn')
		} finally {
			rmSync(dir2, { recursive: true, force: true })
		}
	})

	it('lists existing workflows and dependabot config', () => {
		mkdirSync(join(dir, '.github', 'workflows'), { recursive: true })
		writeFileSync(join(dir, '.github', 'workflows', 'ci.yml'), '')
		writeFileSync(join(dir, '.github', 'dependabot.yml'), '')
		const exec = fakeExec({
			nameWithOwner: 'octo/repo',
			defaultBranchRef: 'main',
			'repos/octo/repo/rulesets': '[]',
			'repos/octo/repo': '{}',
		})
		const { state } = detectState({ dir, out, exec })
		expect(state.detected.existingWorkflows).toEqual(['ci.yml'])
		expect(state.detected.hasDependabotConfig).toBe(true)
	})

	it('removes a legacy in-repo state artifact and reports it', () => {
		mkdirSync(join(dir, '.github'), { recursive: true })
		writeFileSync(join(dir, '.github', 'setup-state.json'), '{}')
		const exec = fakeExec({
			nameWithOwner: 'octo/repo',
			defaultBranchRef: 'main',
			'repos/octo/repo/rulesets': '[]',
			'repos/octo/repo': '{}',
		})
		const { ack } = detectState({ dir, out, exec })
		expect(ack.removedLegacyArtifact).toBe(join(dir, '.github', 'setup-state.json'))
		expect(existsSync(join(dir, '.github', 'setup-state.json'))).toBe(false)
	})

	it('defaults the artifact path to the deterministic per-repo temp path when --out is not given', () => {
		const exec = fakeExec({
			nameWithOwner: 'octo/repo',
			defaultBranchRef: 'main',
			'repos/octo/repo/rulesets': '[]',
			'repos/octo/repo': '{}',
		})
		const { ack } = detectState({ dir, exec })
		expect(existsSync(ack.artifact)).toBe(true)
		rmSync(ack.artifact, { force: true })
	})

	it('ignores unreadable directories while scanning for language', () => {
		mkdirSync(join(dir, 'node_modules', 'x'), { recursive: true })
		writeFileSync(join(dir, 'node_modules', 'x', 'index.js'), '')
		writeFileSync(join(dir, 'app.py'), '')
		const exec = fakeExec({
			nameWithOwner: 'octo/repo',
			defaultBranchRef: 'main',
			'repos/octo/repo/rulesets': '[]',
			'repos/octo/repo': '{}',
		})
		const { state } = detectState({ dir, out, exec })
		expect(state.detected.language).toBe('python')
	})

	it('stops scanning for language past a depth of 3', () => {
		const deep = join(dir, 'a', 'b', 'c', 'd')
		mkdirSync(deep, { recursive: true })
		writeFileSync(join(deep, 'index.py'), '')
		const exec = fakeExec({
			nameWithOwner: 'octo/repo',
			defaultBranchRef: 'main',
			'repos/octo/repo/rulesets': '[]',
			'repos/octo/repo': '{}',
		})
		const { state } = detectState({ dir, out, exec })
		expect(state.detected.language).toBeNull()
	})

	it('treats settings the CLI could not parse as unset', () => {
		const exec = fakeExec({
			nameWithOwner: 'octo/repo',
			defaultBranchRef: 'main',
			'repos/octo/repo/rulesets': 'not json',
			'repos/octo/repo': 'not json either',
		})
		const { state } = detectState({ dir, out, exec })
		expect(state.current.allowSquashMerge).toBe(true)
		expect(state.current.defaultBranchRuleset).toBeNull()
	})

	it('targets merge commits only: squash and rebase off, merge commits on', () => {
		const exec = fakeExec({
			nameWithOwner: 'octo/repo',
			defaultBranchRef: 'main',
			'repos/octo/repo/rulesets': '[]',
			'repos/octo/repo': JSON.stringify({
				allow_merge_commit: false,
				allow_squash_merge: true,
				allow_rebase_merge: true,
			}),
		})
		const { state } = detectState({ dir, out, exec })
		const row = (setting: string) => state.rows.find((r) => r.setting === setting)
		expect(row('allow_merge_commit')).toMatchObject({ target: 'true', action: 'will set' })
		expect(row('allow_squash_merge')).toMatchObject({ target: 'false', action: 'will set' })
		expect(row('allow_rebase_merge')).toMatchObject({ target: 'false', action: 'will set' })
	})

	it('reports merge-strategy settings already at the baseline as set', () => {
		const exec = fakeExec({
			nameWithOwner: 'octo/repo',
			defaultBranchRef: 'main',
			'repos/octo/repo/rulesets': '[]',
			'repos/octo/repo': JSON.stringify({
				allow_merge_commit: true,
				allow_squash_merge: false,
				allow_rebase_merge: false,
			}),
		})
		const { state } = detectState({ dir, out, exec })
		for (const setting of ['allow_merge_commit', 'allow_squash_merge', 'allow_rebase_merge']) {
			expect(state.rows.find((r) => r.setting === setting)?.action).toBe('already set')
		}
	})

	describe('triage bypass actor', () => {
		function rulesetExec(rulesets: object[]): Exec {
			const responses: Record<string, string> = { nameWithOwner: 'octo/repo', defaultBranchRef: 'main' }
			for (const r of rulesets) responses[`repos/octo/repo/rulesets/${(r as { id: number }).id}`] = JSON.stringify(r)
			responses['repos/octo/repo/rulesets'] = JSON.stringify(rulesets)
			responses['repos/octo/repo'] = '{}'
			return fakeExec(responses)
		}

		it('reports a Triage (RepositoryRole 2) bypass actor as drift and offers to remove it', () => {
			const exec = rulesetExec([
				{
					id: 7,
					name: 'main',
					target: 'branch',
					enforcement: 'active',
					conditions: { ref_name: { include: ['~DEFAULT_BRANCH'] } },
					bypass_actors: [
						{ actor_id: 5, actor_type: 'RepositoryRole', bypass_mode: 'always' },
						{ actor_id: 2, actor_type: 'RepositoryRole', bypass_mode: 'always' },
					],
				},
			])
			const { ack, state } = detectState({ dir, out, exec })
			expect(state.current.triageBypass).toEqual([{ id: 7, name: 'main' }])
			expect(state.rows.find((r) => r.setting === 'triage bypass actor')).toEqual({
				setting: 'triage bypass actor',
				current: 'main (7)',
				target: 'none',
				action: 'will offer to remove',
			})
			expect(ack.counts.willSet).toBeGreaterThan(0)
		})

		it('checks every active branch ruleset, not only the default-branch one', () => {
			const exec = rulesetExec([
				{
					id: 7,
					name: 'default-branch-protection',
					target: 'branch',
					enforcement: 'active',
					conditions: { ref_name: { include: ['~DEFAULT_BRANCH'] } },
					bypass_actors: [{ actor_id: 5, actor_type: 'RepositoryRole', bypass_mode: 'always' }],
				},
				{
					id: 9,
					name: 'merge-backstop',
					target: 'branch',
					enforcement: 'active',
					conditions: { ref_name: { include: ['refs/heads/main'] } },
					bypass_actors: [{ actor_id: 2, actor_type: 'RepositoryRole', bypass_mode: 'always' }],
				},
			])
			expect(detectState({ dir, out, exec }).state.current.triageBypass).toEqual([{ id: 9, name: 'merge-backstop' }])
		})

		it('does not mistake a team or integration with id 2 for the Triage role', () => {
			const exec = rulesetExec([
				{
					id: 7,
					name: 'main',
					target: 'branch',
					enforcement: 'active',
					conditions: { ref_name: { include: ['~DEFAULT_BRANCH'] } },
					bypass_actors: [
						{ actor_id: 2, actor_type: 'Team', bypass_mode: 'always' },
						{ actor_id: 2, actor_type: 'Integration', bypass_mode: 'always' },
					],
				},
			])
			const { state } = detectState({ dir, out, exec })
			expect(state.current.triageBypass).toEqual([])
			expect(state.rows.find((r) => r.setting === 'triage bypass actor')).toMatchObject({
				current: 'none',
				action: 'already set',
			})
		})
	})

	describe('merge backstop', () => {
		function backstopExec(extra: Record<string, string>, repo: object = {}): Exec {
			return fakeExec({
				nameWithOwner: 'octo/repo',
				defaultBranchRef: 'main',
				'repos/octo/repo/rulesets': '[]',
				...extra,
				'repos/octo/repo/rules/branches/main': extra['rules/branches/main'] ?? '[]',
				'protection/required_status_checks': extra['protection/required_status_checks'] ?? 'not found',
				'repos/octo/repo': JSON.stringify(repo),
			})
		}

		it('reports none and offers one when nothing gates merges', () => {
			const { state } = detectState({ dir, out, exec: backstopExec({}) })
			expect(state.current.mergeBackstop).toEqual({
				mergeQueue: false,
				strictUpToDate: false,
				thirdPartyQueue: null,
				mergeQueueAvailability: 'unavailable',
			})
			const row = state.rows.find((r) => r.setting === 'merge backstop')
			expect(row).toEqual({
				setting: 'merge backstop',
				current: 'none',
				target: 'require up to date',
				action: 'will offer',
			})
		})

		it('detects a native merge queue from the branch rules', () => {
			const exec = backstopExec(
				{ 'rules/branches/main': JSON.stringify([{ type: 'deletion' }, { type: 'merge_queue', parameters: {} }]) },
				{ owner: { type: 'Organization' }, private: false },
			)
			const { state } = detectState({ dir, out, exec })
			expect(state.current.mergeBackstop.mergeQueue).toBe(true)
			expect(state.current.mergeBackstop.mergeQueueAvailability).toBe('available')
			expect(state.rows.find((r) => r.setting === 'merge backstop')).toMatchObject({
				current: 'merge queue',
				target: 'merge queue',
				action: 'already set',
			})
		})

		it('detects a strict up-to-date rule from a ruleset', () => {
			const exec = backstopExec({
				'rules/branches/main': JSON.stringify([
					{ type: 'required_status_checks', parameters: { strict_required_status_checks_policy: true } },
				]),
			})
			const { state } = detectState({ dir, out, exec })
			expect(state.current.mergeBackstop.strictUpToDate).toBe(true)
			expect(state.rows.find((r) => r.setting === 'merge backstop')?.current).toBe('require up to date')
		})

		it('does not count required checks that are not strict', () => {
			const exec = backstopExec({
				'rules/branches/main': JSON.stringify([
					{ type: 'required_status_checks', parameters: { strict_required_status_checks_policy: false } },
				]),
			})
			expect(detectState({ dir, out, exec }).state.current.mergeBackstop.strictUpToDate).toBe(false)
		})

		it('detects a strict up-to-date rule from classic branch protection', () => {
			const exec = backstopExec({ 'protection/required_status_checks': JSON.stringify({ strict: true }) })
			expect(detectState({ dir, out, exec }).state.current.mergeBackstop.strictUpToDate).toBe(true)
		})

		it('detects a third-party merge queue by its config file', () => {
			writeFileSync(join(dir, '.mergify.yml'), 'queue_rules: []')
			const { state } = detectState({ dir, out, exec: backstopExec({}) })
			expect(state.current.mergeBackstop.thirdPartyQueue).toEqual({ tool: 'mergify', config: '.mergify.yml' })
			expect(state.rows.find((r) => r.setting === 'merge backstop')).toMatchObject({
				current: 'mergify (.mergify.yml)',
				action: 'already set',
			})
		})

		it('reports a private organization repo as needing GitHub Enterprise Cloud for a merge queue', () => {
			const exec = backstopExec({}, { owner: { type: 'Organization' }, private: true })
			const { state } = detectState({ dir, out, exec })
			expect(state.current.mergeBackstop.mergeQueueAvailability).toBe('enterprise-cloud-only')
			expect(state.rows.find((r) => r.setting === 'merge backstop')?.target).toBe('merge queue')
		})

		it('treats branch rules the CLI did not return as a list as none', () => {
			const exec = backstopExec({ 'rules/branches/main': '{"message":"Not Found"}' })
			expect(detectState({ dir, out, exec }).state.current.mergeBackstop.mergeQueue).toBe(false)
		})

		// The fake matches by substring in key order, so each per-id key must come before the list key.
		function rulesetsExec(rulesets: object[], branchRules: object[] = []): Exec {
			const responses: Record<string, string> = { nameWithOwner: 'octo/repo', defaultBranchRef: 'main' }
			for (const r of rulesets) responses[`repos/octo/repo/rulesets/${(r as { id: number }).id}`] = JSON.stringify(r)
			responses['repos/octo/repo/rulesets'] = JSON.stringify(rulesets)
			responses['repos/octo/repo/rules/branches/main'] = JSON.stringify(branchRules)
			responses['protection/required_status_checks'] = 'not found'
			responses['repos/octo/repo'] = JSON.stringify({ owner: { type: 'Organization' }, private: false })
			return fakeExec(responses)
		}

		const defaultRuleset = {
			id: 7,
			name: 'default-branch-protection',
			target: 'branch',
			enforcement: 'active',
			conditions: { ref_name: { include: ['~DEFAULT_BRANCH'] } },
			rules: [{ type: 'deletion' }, { type: 'merge_queue', parameters: {} }],
		}

		it('reports a backstop kept in the default-branch ruleset as in place', () => {
			const { state } = detectState({
				dir,
				out,
				exec: rulesetsExec([defaultRuleset], [{ type: 'merge_queue', parameters: {} }]),
			})
			expect(state.current.separateBackstop).toEqual([])
			expect(state.rows.find((r) => r.setting === 'merge backstop ruleset')).toEqual({
				setting: 'merge backstop ruleset',
				current: 'default-branch ruleset',
				target: 'default-branch ruleset',
				action: 'already set',
			})
		})

		it('reports a backstop in its own ruleset and offers to fold it into the default-branch ruleset', () => {
			const backstop = {
				id: 9,
				name: 'merge-backstop',
				target: 'branch',
				enforcement: 'active',
				conditions: { ref_name: { include: ['~DEFAULT_BRANCH'] } },
				bypass_actors: [],
				rules: [{ type: 'merge_queue', parameters: { merge_method: 'SQUASH' } }],
			}
			const strict = {
				id: 11,
				name: 'up-to-date',
				target: 'branch',
				enforcement: 'active',
				conditions: { ref_name: { include: ['refs/heads/main'] } },
				rules: [{ type: 'required_status_checks', parameters: { strict_required_status_checks_policy: true } }],
			}
			const loose = {
				id: 12,
				name: 'checks',
				target: 'branch',
				enforcement: 'active',
				conditions: { ref_name: { include: ['refs/heads/main'] } },
				rules: [{ type: 'required_status_checks', parameters: { strict_required_status_checks_policy: false } }],
			}
			const { ack, state } = detectState({
				dir,
				out,
				exec: rulesetsExec(
					[{ ...defaultRuleset, rules: [{ type: 'deletion' }] }, backstop, strict, loose],
					[{ type: 'merge_queue', parameters: {} }],
				),
			})
			expect(state.current.separateBackstop).toEqual([
				{ id: 9, name: 'merge-backstop' },
				{ id: 11, name: 'up-to-date' },
			])
			expect(state.rows.find((r) => r.setting === 'merge backstop ruleset')).toEqual({
				setting: 'merge backstop ruleset',
				current: 'merge-backstop (9), up-to-date (11)',
				target: 'default-branch ruleset',
				action: 'will offer to fold',
			})
			expect(ack.counts.willSet).toBeGreaterThan(0)
		})

		it('reports no backstop ruleset when there is no backstop', () => {
			const { state } = detectState({ dir, out, exec: backstopExec({}) })
			expect(state.rows.find((r) => r.setting === 'merge backstop ruleset')).toMatchObject({
				current: 'none',
				action: 'already set',
			})
		})

		it('lists the workflows that trigger on merge_group', () => {
			const workflows = join(dir, '.github', 'workflows')
			mkdirSync(workflows, { recursive: true })
			writeFileSync(join(workflows, 'ci.yml'), 'on:\n  pull_request:\n  merge_group:\n')
			writeFileSync(join(workflows, 'list.yml'), 'on: [pull_request, merge_group]\n')
			writeFileSync(join(workflows, 'seq.yml'), 'on:\n  - pull_request\n  - merge_group\n')
			writeFileSync(join(workflows, 'release.yml'), 'on:\n  push:\n')
			mkdirSync(join(workflows, 'not-a-file.yml'))
			const { state } = detectState({ dir, out, exec: backstopExec({}) })
			expect(state.detected.mergeGroupWorkflows.sort()).toEqual(['ci.yml', 'list.yml', 'seq.yml'])
		})
	})
})
