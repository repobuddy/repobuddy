import { describe, expect, it } from '@jest/globals'
import type { Facts } from './facts.js'
import { buildChecks, formatReport, INSTRUCTION_TOKEN_BUDGET, MAX_LEVEL, score } from './score.js'

/** A repo that passes every check the script can decide. */
function readyFacts(overrides: Partial<Facts> = {}): Facts {
	return {
		isGitRepo: true,
		hasReadme: true,
		hasManifest: true,
		scripts: ['build', 'test', 'verify'],
		ciConfigs: ['.github/workflows'],
		instructionFiles: [{ path: 'AGENTS.md', tokens: 800 }],
		skillDescriptions: [{ path: '.agents/skills/a/SKILL.md', name: 'a', tokens: 30 }],
		missingInstructionCommands: [],
		toolchainPins: ['package.json#packageManager'],
		hasLockfile: true,
		preCommitHooks: ['.husky'],
		hasContributing: true,
		hasIssueTemplates: true,
		isMonorepo: false,
		tsStrict: true,
		largeFiles: [],
		trackedBuildOutput: [],
		envIgnored: true,
		committedSecretFiles: [],
		mcpLiteralCredentials: [],
		...overrides,
	}
}

function check(facts: Facts, id: string) {
	return buildChecks(facts).find((c) => c.id === id)
}

describe('score', () => {
	it('awards the highest level when every decidable check passes', () => {
		const result = score(readyFacts())
		expect(result.level).toBe(MAX_LEVEL)
		expect(result.securityCap).toBeUndefined()
		expect(result.topFixes).toEqual([])
	})

	it('stops at the first failed gate, however much passes above it', () => {
		const result = score(readyFacts({ scripts: ['build', 'test'] }))
		expect(result.level).toBe(1)
		expect(result.topFixes[0]?.id).toBe('verify-command')
	})

	it('is level 0 when there is no README', () => {
		expect(score(readyFacts({ hasReadme: false })).level).toBe(0)
	})

	it('does not let a failed non-gate lower the level', () => {
		const result = score(readyFacts({ hasContributing: false, hasIssueTemplates: false }))
		expect(result.level).toBe(MAX_LEVEL)
		expect(result.topFixes.map((c) => c.id)).toEqual(['contributing', 'issue-templates'])
	})

	it('caps the level at 1 for a committed secret and ranks it first', () => {
		const result = score(readyFacts({ committedSecretFiles: ['.env'], hasContributing: false }))
		expect(result.gatedLevel).toBe(MAX_LEVEL)
		expect(result.securityCap).toBe(1)
		expect(result.level).toBe(1)
		expect(result.topFixes[0]?.id).toBe('committed-secrets')
	})

	it('caps the level at 2 when .env is not ignored', () => {
		expect(score(readyFacts({ envIgnored: false })).level).toBe(2)
	})

	it('caps the level at 1 for a literal MCP credential', () => {
		expect(score(readyFacts({ mcpLiteralCredentials: ['.mcp.json: API_KEY'] })).level).toBe(1)
	})

	it('ranks the gate that blocks the next level ahead of heavier non-gates', () => {
		const result = score(readyFacts({ toolchainPins: [], ciConfigs: [] }))
		expect(result.level).toBe(2)
		expect(result.topFixes.map((c) => c.id)).toEqual(['toolchain-pinned', 'ci-config'])
	})

	it('lists the pending judgment gates at or below the awarded level', () => {
		const ids = score(readyFacts()).pendingJudgments.map((c) => c.id)
		expect(ids).toEqual(['ci-runs-verify', 'instructions-accurate', 'setup-documented'])
	})

	it('adds instruction and skill-description tokens per session', () => {
		expect(score(readyFacts()).tokensPerSession).toEqual({ instructions: 800, skills: 30, total: 830 })
	})

	it('scores each area over its decided checks only', () => {
		const areas = score(readyFacts({ scripts: ['test'], tsStrict: undefined })).areas
		expect(areas.find((a) => a.area === 'verification')).toMatchObject({ passed: 3, total: 4, score: 75 })
		expect(areas.find((a) => a.area === 'self-describing')).toMatchObject({ total: 0, score: undefined })
	})
})

describe('buildChecks', () => {
	it('fails the lean gate past the instruction token budget', () => {
		const facts = readyFacts({ instructionFiles: [{ path: 'AGENTS.md', tokens: INSTRUCTION_TOKEN_BUDGET + 1 }] })
		expect(check(facts, 'instructions-lean')?.status).toBe('fail')
		expect(score(facts).level).toBe(3)
	})

	it('marks instruction checks n/a when there is no instructions file', () => {
		const facts = readyFacts({ instructionFiles: [] })
		expect(check(facts, 'instructions-file')?.status).toBe('fail')
		expect(check(facts, 'instructions-commands')?.status).toBe('n/a')
		expect(check(facts, 'instructions-lean')?.status).toBe('n/a')
	})

	it('fails when the instructions name a script that does not exist', () => {
		const c = check(readyFacts({ missingInstructionCommands: ['pnpm lint'] }), 'instructions-commands')
		expect(c).toMatchObject({ status: 'fail', detail: ['pnpm lint'] })
	})

	it('truncates long detail lists', () => {
		const largeFiles = Array.from({ length: 12 }, (_, i) => ({ path: `f${i}.ts`, lines: 2000 }))
		const detail = check(readyFacts({ largeFiles }), 'large-files')?.detail
		expect(detail).toHaveLength(11)
		expect(detail?.[10]).toBe('… and 2 more')
	})

	it('reports a file too big to count', () => {
		const c = check(readyFacts({ largeFiles: [{ path: 'huge.js', lines: Number.POSITIVE_INFINITY }] }), 'large-files')
		expect(c?.detail).toEqual(['huge.js: >4MB'])
	})

	it('asks for judgment on the monorepo map only in a monorepo', () => {
		expect(check(readyFacts(), 'monorepo-map')?.status).toBe('n/a')
		expect(check(readyFacts({ isMonorepo: true }), 'monorepo-map')?.status).toBe('judge')
	})

	it('skips CI-parity judgment when there is no verify command or CI', () => {
		expect(check(readyFacts({ ciConfigs: [] }), 'ci-runs-verify')?.status).toBe('n/a')
		expect(check(readyFacts({ envIgnored: undefined }), 'env-ignored')?.status).toBe('n/a')
		expect(check(readyFacts({ tsStrict: false }), 'ts-strict')?.status).toBe('fail')
	})
})

describe('formatReport', () => {
	it('leads with the level and the fixes', () => {
		const text = formatReport(score(readyFacts({ committedSecretFiles: ['.env'], hasContributing: false })))
		expect(text.split('\n')[0]).toBe('Level 1 of 4: An agent can read it')
		expect(text).toMatch(/caps it at 1/)
		expect(text).toMatch(/1\. \[security\]/)
		expect(text).toMatch(/Tokens loaded per session: ~830/)
		expect(text).toMatch(/FAIL {2}L1\* committed-secrets/)
	})

	it('names the owning skill on a handed-off fix', () => {
		expect(formatReport(score(readyFacts({ ciConfigs: [] })))).toMatch(/\(owner: setup-github-repo\)/)
	})

	it('says when the script sees nothing to fix', () => {
		expect(formatReport(score(readyFacts()))).toMatch(/nothing the script can see/)
	})
})
