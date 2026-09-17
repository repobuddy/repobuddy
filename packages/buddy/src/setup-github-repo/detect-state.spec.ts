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
			'repos/octo/repo/rulesets': JSON.stringify([
				{
					id: 7,
					name: 'default-branch-protection',
					target: 'branch',
					enforcement: 'active',
					conditions: { ref_name: { include: ['~DEFAULT_BRANCH'] } },
				},
			]),
			'repos/octo/repo': JSON.stringify({
				delete_branch_on_merge: true,
				allow_auto_merge: true,
				allow_merge_commit: false,
				allow_squash_merge: true,
				allow_rebase_merge: true,
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

	it('reports "will set" for merge-strategy settings that are currently false', () => {
		const exec = fakeExec({
			nameWithOwner: 'octo/repo',
			defaultBranchRef: 'main',
			'repos/octo/repo/rulesets': '[]',
			'repos/octo/repo': JSON.stringify({ allow_squash_merge: false, allow_rebase_merge: false }),
		})
		const { state } = detectState({ dir, out, exec })
		const squash = state.rows.find((r) => r.setting === 'allow_squash_merge')
		const rebase = state.rows.find((r) => r.setting === 'allow_rebase_merge')
		expect(squash?.action).toBe('will set')
		expect(rebase?.action).toBe('will set')
	})
})
