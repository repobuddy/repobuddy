import { describe, expect, it } from '@jest/globals'
import type { PackageFacts } from './package-facts.js'
import { buildPackageChecks, formatPackageReport, scorePackage } from './package-score.js'
import { MAX_LEVEL } from './score.js'

/** A package that passes every check the script can decide. */
function readyFacts(overrides: Partial<PackageFacts> = {}): PackageFacts {
	return {
		name: 'x',
		hasReadme: true,
		readmeExamples: 2,
		entryPoints: ['exports'],
		hasExports: true,
		exportsProblems: [],
		declarationEntries: ['esm/index.d.ts'],
		missingDeclarations: [],
		declarationFiles: ['esm/index.d.ts', 'esm/a.d.ts'],
		exportedSymbols: [
			{ file: 'esm/index.d.ts', name: 'one', documented: true },
			{ file: 'cjs/index.d.ts', name: 'one', documented: true },
		],
		anyUsages: [],
		deprecatedTags: 0,
		declarationTokens: 120,
		changelog: { path: 'CHANGELOG.md', versions: 3, unlabelledMajors: [] },
		llmsTxt: ['llms.txt'],
		llmsDriftChecks: ['package.json#docs:llms:check'],
		shippedSkills: [],
		...overrides,
	}
}

function check(facts: PackageFacts, id: string) {
	return buildPackageChecks(facts).find((c) => c.id === id)
}

describe('scorePackage', () => {
	it('awards the highest level when every decidable check passes', () => {
		const result = scorePackage(readyFacts())
		expect(result.level).toBe(MAX_LEVEL)
		expect(result.levelName).toBe('An agent keeps up with it cheaply')
		expect(result.topFixes).toEqual([])
	})

	it('is level 0 with no entry point, and level 1 with no declarations', () => {
		expect(scorePackage(readyFacts({ entryPoints: [] })).level).toBe(0)
		const untyped = scorePackage(readyFacts({ declarationEntries: [], declarationFiles: [], exportedSymbols: [] }))
		expect(untyped.level).toBe(1)
		expect(untyped.topFixes[0]?.id).toBe('types-ship')
	})

	it('stops at level 2 for an undocumented export or an `any`', () => {
		const undocumented = [{ file: 'esm/index.d.ts', name: 'two', documented: false }]
		expect(scorePackage(readyFacts({ exportedSymbols: undocumented })).level).toBe(2)
		expect(scorePackage(readyFacts({ anyUsages: ['esm/index.d.ts:3'] })).level).toBe(2)
	})

	it('stops at level 3 without an llms.txt, and hands that fix to llms-txt', () => {
		const result = scorePackage(readyFacts({ llmsTxt: [], llmsDriftChecks: [] }))
		expect(result.level).toBe(3)
		expect(result.topFixes[0]).toMatchObject({ id: 'llms-txt', handoff: 'llms-txt' })
		expect(check(readyFacts({ llmsTxt: [] }), 'llms-drift-check')?.status).toBe('n/a')
		expect(check(readyFacts({ llmsDriftChecks: [] }), 'llms-drift-check')?.status).toBe('fail')
	})

	it('lists the pending judgment gates at or below the awarded level', () => {
		const ids = scorePackage(readyFacts()).pendingJudgments.map((c) => c.id)
		expect(ids).toEqual(['readme-examples', 'actionable-errors', 'llms-accurate'])
	})

	it('reports the surface and shipped skills without scoring them', () => {
		const result = scorePackage(readyFacts({ shippedSkills: ['skills/x/SKILL.md'] }))
		expect(result.surface).toEqual({ exports: 1, declarationFiles: 2, declarationTokens: 120 })
		expect(result.shippedSkills).toEqual(['skills/x/SKILL.md'])
		expect(result.areas.map((a) => a.area)).toEqual(['api', 'docs', 'errors', 'changelog', 'llms-txt'])
		expect(result.areas.find((a) => a.area === 'errors')?.score).toBeUndefined()
	})
})

describe('buildPackageChecks', () => {
	it('asks for a build when the declarations are declared but not on disk', () => {
		const facts = readyFacts({ missingDeclarations: ['esm/index.d.ts'], declarationFiles: [], exportedSymbols: [] })
		expect(check(facts, 'types-ship')).toMatchObject({
			status: 'pass',
			detail: ['not built yet: esm/index.d.ts', 'esm/index.d.ts'],
		})
		expect(check(facts, 'exports-documented')?.status).toBe('judge')
		expect(check(facts, 'no-any')).toMatchObject({
			status: 'judge',
			detail: [expect.stringMatching(/build the package/)],
		})
		expect(check(facts, 'deprecations-marked')?.status).toBe('n/a')
	})

	it('marks the declaration checks n/a when no types ship', () => {
		const facts = readyFacts({ declarationEntries: [], declarationFiles: [], exportedSymbols: [] })
		expect(check(facts, 'exports-documented')).toMatchObject({ status: 'n/a', detail: [] })
		expect(check(facts, 'no-any')?.status).toBe('n/a')
	})

	it('lists the undocumented exports under the documented count', () => {
		const exportedSymbols = [
			{ file: 'a.d.ts', name: 'a', documented: true },
			{ file: 'a.d.ts', name: 'b', documented: false },
		]
		expect(check(readyFacts({ exportedSymbols }), 'exports-documented')).toMatchObject({
			status: 'fail',
			detail: ['1/2 documented', 'a.d.ts: b'],
		})
	})

	it('fails the exports map when it is missing or has problems', () => {
		expect(check(readyFacts({ hasExports: false }), 'exports-map')).toMatchObject({
			status: 'fail',
			detail: ['no `exports` field'],
		})
		expect(check(readyFacts({ exportsProblems: ['p'] }), 'exports-map')).toMatchObject({
			status: 'fail',
			detail: ['p'],
		})
	})

	it('fails README examples when there are none, and skips them with no README', () => {
		expect(check(readyFacts({ readmeExamples: 0 }), 'readme-examples')?.status).toBe('fail')
		expect(check(readyFacts({ hasReadme: false }), 'readme-examples')).toMatchObject({ status: 'n/a', detail: [] })
		expect(scorePackage(readyFacts({ hasReadme: false })).level).toBe(0)
	})

	it('grades the changelog and its breaking-change labels', () => {
		expect(check(readyFacts({ changelog: undefined }), 'changelog')?.status).toBe('fail')
		expect(check(readyFacts({ changelog: undefined }), 'breaking-labelled')?.status).toBe('n/a')
		const empty = { path: 'CHANGELOG.md', versions: 0, unlabelledMajors: [] }
		expect(check(readyFacts({ changelog: empty }), 'changelog')?.status).toBe('fail')
		const unlabelled = { path: 'CHANGELOG.md', versions: 2, unlabelledMajors: ['2.0.0'] }
		expect(check(readyFacts({ changelog: unlabelled }), 'breaking-labelled')).toMatchObject({
			status: 'fail',
			detail: ['2.0.0: no "Major Changes" or "BREAKING"'],
		})
	})
})

describe('formatPackageReport', () => {
	it('leads with the package and level, and reports surface and skills', () => {
		const text = formatPackageReport(scorePackage(readyFacts({ llmsTxt: [] })))
		expect(text.split('\n')[0]).toBe('Package x: level 3 of 4: An agent can use it without reading the source')
		expect(text).toMatch(/provisional: 2 gate\(s\)/)
		expect(text).toMatch(/1\. \[llms-txt\].*\n.*\(owner: llms-txt\)/)
		expect(text).toMatch(/Public surface \(reported, not scored\): 1 exported symbol\(s\), ~120 tokens in 2/)
		expect(text).toMatch(/Shipped agent skill \(checked, not required\): none/)
		expect(text).toMatch(/FAIL {2}L4\* llms-txt/)
	})

	it('names an unnamed package, shipped skills, and an empty fix list', () => {
		const text = formatPackageReport(
			scorePackage(readyFacts({ name: undefined, shippedSkills: ['skills/a/SKILL.md'] })),
		)
		expect(text.split('\n')[0]).toMatch(/^Package \(unnamed\): level 4/)
		expect(text).toMatch(/not required\): skills\/a\/SKILL\.md/)
		expect(text).toMatch(/nothing the script can see/)
	})
})
