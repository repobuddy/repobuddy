import { describe, expect, it } from '@jest/globals'
import type { Facts } from './facts.js'
import {
	AREA_WEIGHTS,
	buildChecks,
	COMMENT_SHARE_BUDGET,
	checkLevel,
	formatCheck,
	formatReport,
	INSTRUCTION_TOKEN_BUDGET,
	MAX_LEVEL,
	score,
} from './score.js'

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
		comments: { files: 10, codeLines: 900, commentLines: 100, heaviest: [], orphanedJsdoc: [] },
		nameCollisions: [],
		undocumentedEnv: [],
		deadCodeCommand: undefined,
		benchBaselineAt: new Date().toISOString(),
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

	it('awards level 5 only for a bench baseline at most 90 days old', () => {
		const now = new Date('2026-09-28T00:00:00Z')
		const daysAgo = (n: number) => new Date(now.getTime() - n * 86_400_000).toISOString()
		expect(score(readyFacts({ benchBaselineAt: daysAgo(90) }), { now }).level).toBe(5)
		expect(score(readyFacts({ benchBaselineAt: daysAgo(91) }), { now }).level).toBe(4)
		const missing = score(readyFacts({ benchBaselineAt: undefined }), { now })
		expect(missing.level).toBe(4)
		expect(missing.topFixes[0]?.id).toBe('bench-baseline')
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
		expect(areas.find((a) => a.area === 'verification')).toMatchObject({ passed: 4, total: 5, score: 80 })
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

	it('asks for judgment on comments only past the comment budget, with the files to sample', () => {
		const heavy = {
			files: 2,
			codeLines: 70,
			commentLines: 30,
			heaviest: [{ path: 'src/a.ts', commentLines: 25, codeLines: 20 }],
			orphanedJsdoc: [],
		}
		expect(COMMENT_SHARE_BUDGET).toBeLessThan(0.3)
		expect(check(readyFacts(), 'comment-signal')?.status).toBe('pass')
		expect(check(readyFacts({ comments: heavy }), 'comment-signal')).toMatchObject({
			status: 'judge',
			detail: ['30% comments: 30 of 100 non-test source lines in 2 files', 'src/a.ts: 25 comment, 20 code lines'],
		})
		expect(check(readyFacts({ comments: undefined }), 'comment-signal')?.status).toBe('n/a')
	})

	it('fails on orphaned JSDoc and lists where each block is', () => {
		const comments = { files: 1, codeLines: 9, commentLines: 1, heaviest: [], orphanedJsdoc: ['src/a.ts:3'] }
		expect(check(readyFacts({ comments }), 'orphaned-jsdoc')).toMatchObject({ status: 'fail', detail: ['src/a.ts:3'] })
		expect(check(readyFacts(), 'orphaned-jsdoc')?.status).toBe('pass')
		expect(check(readyFacts({ comments: undefined }), 'orphaned-jsdoc')?.status).toBe('n/a')
	})

	it('asks for judgment on names that flood a grep', () => {
		const nameCollisions = [{ name: 'run', declaredIn: 3, matchingFiles: 40 }]
		expect(check(readyFacts({ nameCollisions }), 'generic-names')).toMatchObject({
			status: 'judge',
			detail: ['run: declared in 3 file(s), grep matches 40 files'],
		})
		expect(check(readyFacts(), 'generic-names')?.status).toBe('pass')
		expect(check(readyFacts({ nameCollisions: undefined }), 'generic-names')?.status).toBe('n/a')
	})

	it('fails on environment variables no setup document names', () => {
		const undocumentedEnv = [{ name: 'API_URL', readIn: 'src/client.ts' }]
		expect(check(readyFacts({ undocumentedEnv }), 'env-documented')).toMatchObject({
			status: 'fail',
			detail: ['API_URL: read in src/client.ts'],
		})
		expect(check(readyFacts(), 'env-documented')?.status).toBe('pass')
		expect(check(readyFacts({ undocumentedEnv: undefined }), 'env-documented')?.status).toBe('n/a')
	})

	it('names the knip command to run for dead code, and skips it without knip', () => {
		expect(check(readyFacts({ deadCodeCommand: 'pnpm knip' }), 'dead-code')).toMatchObject({
			status: 'judge',
			detail: ['run: pnpm knip'],
		})
		expect(check(readyFacts(), 'dead-code')?.status).toBe('n/a')
	})

	it('settles dead code from a --run-knip run', () => {
		const command = 'pnpm knip'
		expect(
			check(
				readyFacts({ deadCodeCommand: command, deadCodeRun: { command, outcome: 'clean', groups: [] } }),
				'dead-code',
			),
		).toMatchObject({ status: 'pass', detail: ['ran: pnpm knip'] })
		expect(
			check(
				readyFacts({
					deadCodeCommand: command,
					deadCodeRun: { command, outcome: 'found', groups: ['Unused exports (4)'] },
				}),
				'dead-code',
			),
		).toMatchObject({ status: 'fail', detail: ['ran: pnpm knip', 'Unused exports (4)'] })
		expect(
			check(
				readyFacts({
					deadCodeCommand: command,
					deadCodeRun: { command, outcome: 'error', groups: [], error: 'exit 2: config error' },
				}),
				'dead-code',
			),
		).toMatchObject({
			status: 'judge',
			detail: ['run: pnpm knip', '--run-knip could not complete it: exit 2: config error'],
		})
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
		expect(text.split('\n')[0]).toBe('Level 1 of 5: An agent can read it')
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

describe('weight overrides', () => {
	it('uses the default weights when there is no override', () => {
		const result = score(readyFacts())
		expect(result.weights).toEqual(AREA_WEIGHTS)
		expect(result.overriddenWeights).toEqual([])
	})

	it('merges an override over the defaults and reorders the fixes by it', () => {
		const facts = readyFacts({ hasContributing: false, hasLockfile: false, preCommitHooks: [] })
		expect(score(facts).topFixes.map((c) => c.id)).toEqual(['fast-feedback', 'lockfile', 'contributing'])
		const result = score(facts, { weights: { 'task-discovery': 100, verification: 25 } })
		expect(result.weights['task-discovery']).toBe(100)
		expect(result.overriddenWeights).toEqual(['task-discovery'])
		expect(result.areas.find((a) => a.area === 'task-discovery')?.weight).toBe(100)
		expect(result.topFixes.map((c) => c.id)).toEqual(['contributing', 'fast-feedback', 'lockfile'])
	})

	it('never changes the level', () => {
		const facts = readyFacts({ toolchainPins: [] })
		const zeroed = Object.fromEntries(Object.keys(AREA_WEIGHTS).map((a) => [a, 0]))
		expect(score(facts, { weights: zeroed }).level).toBe(score(facts).level)
	})

	it('marks overridden weights in the report', () => {
		const text = formatReport(score(readyFacts(), { weights: { noise: 40 } }))
		expect(text).toMatch(/noise +40: .*\(repo override\)/)
		expect(text).not.toMatch(/verification.*repo override/)
	})
})

describe('checkLevel', () => {
	it('passes at the threshold and lists the unsettled judgment gates at or below it', () => {
		const result = score(readyFacts())
		expect(checkLevel(result, 2)).toEqual({ minLevel: 2, passed: true, provisional: ['ci-runs-verify'] })
		expect(checkLevel(result, 3).provisional).toEqual(['ci-runs-verify', 'instructions-accurate', 'setup-documented'])
	})

	it('fails below the threshold on script-decided gates, with nothing provisional', () => {
		const result = score(readyFacts({ toolchainPins: [] }))
		expect(checkLevel(result, 3)).toEqual({ minLevel: 3, passed: false, provisional: [] })
	})

	it('fails when a security finding caps the level below the threshold', () => {
		expect(checkLevel(score(readyFacts({ envIgnored: false })), 3).passed).toBe(false)
	})

	it('formats a pass, a provisional pass, and a fail', () => {
		const ready = score(readyFacts())
		expect(formatCheck(ready.level, checkLevel(ready, 3))).toBe(
			'check: ok, level 5 meets --min-level 3 (provisional: unsettled judgment gates ci-runs-verify, instructions-accurate, setup-documented)\n',
		)
		const clean = score(readyFacts({ ciConfigs: [], instructionFiles: [] }))
		expect(formatCheck(clean.level, checkLevel(clean, 1))).toBe('check: ok, level 2 meets --min-level 1\n')
		const low = score(readyFacts({ scripts: ['test'] }))
		expect(formatCheck(low.level, checkLevel(low, 3))).toBe('check: FAIL, level 1 is below --min-level 3\n')
	})
})
