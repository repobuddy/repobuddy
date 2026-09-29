/**
 * Grades a package's facts into the same gated report `score` gives a repository, with criteria for
 * the consuming side: how cheaply an agent in another repo can use the package through what ships.
 *
 * The JSDoc rule flips here. Inside a repo, comments that restate code are noise; on an exported
 * symbol, a one-line doc is often the only prose a consumer's agent sees.
 */

import type { PackageFacts } from './package-facts.js'
import { type AreaScore, areaScores, type Check, gatedLevel, list, rankFixes } from './score.js'

type PackageArea = 'api' | 'docs' | 'errors' | 'changelog' | 'llms-txt'

/** Starting weights, printed in the report. Like the repository weights, they are estimates, not measurements. */
const PACKAGE_WEIGHTS: Record<PackageArea, number> = {
	api: 30,
	docs: 25,
	errors: 15,
	changelog: 15,
	'llms-txt': 15,
}

/** A package has no behavioral level: `bench` measures a repository, not what consumers' agents spend. */
export const PACKAGE_MAX_LEVEL = 4

const PACKAGE_LEVELS: Record<number, string> = {
	0: 'An agent cannot find its way in',
	1: 'An agent can find it',
	2: 'An agent can call it',
	3: 'An agent can use it without reading the source',
	4: 'An agent keeps up with it cheaply',
}

type PackageCheck = Check<PackageArea>

export interface PackageScoreResult {
	package: string | undefined
	level: number
	levelName: string
	checks: PackageCheck[]
	areas: AreaScore<PackageArea>[]
	topFixes: PackageCheck[]
	/** Pending `judge` gates at or below the awarded level; each one, if it fails, lowers the level. */
	pendingJudgments: PackageCheck[]
	/** Reported, not scored: a smaller surface is cheaper to learn, but size alone is not a defect. */
	surface: { exports: number; declarationFiles: number; declarationTokens: number }
	/** Checked, not required. */
	shippedSkills: string[]
	weights: typeof PACKAGE_WEIGHTS
}

const NOT_BUILT = 'the declarations are not on disk: build the package, or point --package at an installed copy'

export function buildPackageChecks(facts: PackageFacts): PackageCheck[] {
	const hasTypes = facts.declarationEntries.length > 0
	const scanned = facts.declarationFiles.length > 0
	const undocumented = facts.exportedSymbols.filter((s) => !s.documented)
	const hasLlms = facts.llmsTxt.length > 0

	return [
		// Level 1: an agent can find it.
		{
			id: 'readme',
			area: 'docs',
			level: 1,
			gate: true,
			effort: 1,
			status: facts.hasReadme ? 'pass' : 'fail',
			summary: 'A README ships with the package',
			fix: 'Add a README that says what the package does and shows one call.',
		},
		{
			id: 'entry-point',
			area: 'api',
			level: 1,
			gate: true,
			effort: 1,
			status: facts.entryPoints.length > 0 ? 'pass' : 'fail',
			summary: 'package.json names an entry point (exports, main, module, or bin)',
			...(facts.entryPoints.length > 0 ? { detail: facts.entryPoints } : {}),
			fix: 'Declare an `exports` map.',
		},
		// Level 2: an agent can call it.
		{
			id: 'types-ship',
			area: 'api',
			level: 2,
			gate: true,
			effort: 2,
			status: hasTypes ? 'pass' : 'fail',
			summary: 'Type declarations ship (they are the documentation an agent reads first)',
			detail: hasTypes
				? list([...facts.missingDeclarations.map((f) => `not built yet: ${f}`), ...facts.declarationEntries])
				: [],
			fix: 'Emit `.d.ts` files and point `types` (or an `exports` `types` condition) at them.',
		},
		{
			id: 'exports-map',
			area: 'api',
			level: 2,
			gate: true,
			effort: 1,
			status: facts.hasExports && facts.exportsProblems.length === 0 ? 'pass' : 'fail',
			summary: 'A clean `exports` map says what is public',
			...(facts.hasExports ? { detail: facts.exportsProblems } : { detail: ['no `exports` field'] }),
			fix: 'Declare every public subpath in `exports`, `types` first in each condition, and no `./*`.',
		},
		// Level 3: an agent can use it without reading the source.
		{
			id: 'exports-documented',
			area: 'docs',
			level: 3,
			gate: true,
			effort: 2,
			status: !hasTypes ? 'n/a' : !scanned ? 'judge' : undocumented.length === 0 ? 'pass' : 'fail',
			summary: 'Every exported symbol has a doc comment (document the surface, cut inside)',
			detail: !scanned
				? hasTypes
					? [NOT_BUILT]
					: []
				: [
						`${facts.exportedSymbols.length - undocumented.length}/${facts.exportedSymbols.length} documented`,
						...list(undocumented.map((s) => `${s.file}: ${s.name}`)),
					],
			fix: 'Add a one-line `/** … */` to each undocumented export: what it does, and the constraint its type cannot say.',
		},
		{
			id: 'no-any',
			area: 'api',
			level: 3,
			gate: true,
			effort: 2,
			status: !hasTypes ? 'n/a' : !scanned ? 'judge' : facts.anyUsages.length === 0 ? 'pass' : 'fail',
			summary: 'No `any` in the public API',
			...(scanned ? { detail: list(facts.anyUsages) } : hasTypes ? { detail: [NOT_BUILT] } : {}),
			fix: 'Replace each `any` with the real type, a generic, or `unknown`.',
		},
		{
			id: 'readme-examples',
			area: 'docs',
			level: 3,
			gate: true,
			effort: 2,
			status: !facts.hasReadme ? 'n/a' : facts.readmeExamples === 0 ? 'fail' : 'judge',
			summary: 'README examples are real code that runs against the current API, not pseudo-code',
			detail: facts.hasReadme ? [`${facts.readmeExamples} JavaScript or TypeScript example block(s)`] : [],
			fix: 'Show real calls, and keep them compiling: type-check them, or run them as tests.',
		},
		{
			id: 'actionable-errors',
			area: 'errors',
			level: 3,
			gate: true,
			effort: 2,
			status: 'judge',
			summary: 'Errors a consumer can hit say what to do, not what went wrong inside',
			fix: 'Rewrite each thrown message to name the bad input and the fix.',
		},
		// Level 4: an agent keeps up with it cheaply.
		{
			id: 'changelog',
			area: 'changelog',
			level: 4,
			gate: true,
			effort: 2,
			status: facts.changelog !== undefined && facts.changelog.versions > 0 ? 'pass' : 'fail',
			summary: 'A machine-parseable changelog ships (a `## <version>` heading per release)',
			...(facts.changelog
				? { detail: [`${facts.changelog.path}: ${facts.changelog.versions} version heading(s)`] }
				: {}),
			fix: 'Generate the changelog from the release tool (changesets writes one per package).',
			handoff: 'init-changesets',
		},
		{
			id: 'breaking-labelled',
			area: 'changelog',
			level: 4,
			gate: true,
			effort: 1,
			status:
				facts.changelog === undefined || facts.changelog.versions === 0
					? 'n/a'
					: facts.changelog.unlabelledMajors.length === 0
						? 'pass'
						: 'fail',
			summary: 'Each major release labels its breaking changes',
			...(facts.changelog?.unlabelledMajors.length
				? { detail: list(facts.changelog.unlabelledMajors.map((v) => `${v}: no "Major Changes" or "BREAKING"`)) }
				: {}),
			fix: 'Put breaking changes under a "Major Changes" or "BREAKING" heading in each major release.',
		},
		{
			id: 'llms-txt',
			area: 'llms-txt',
			level: 4,
			gate: true,
			effort: 2,
			status: hasLlms ? 'pass' : 'fail',
			summary: 'An `llms.txt` orients a consumer agent',
			...(hasLlms ? { detail: facts.llmsTxt } : {}),
			fix: 'Generate an `llms.txt` from the public surface.',
			handoff: 'llms-txt',
		},
		{
			id: 'llms-drift-check',
			area: 'llms-txt',
			level: 4,
			gate: true,
			effort: 1,
			status: !hasLlms ? 'n/a' : facts.llmsDriftChecks.length > 0 ? 'pass' : 'fail',
			summary: 'A check fails when `llms.txt` drifts from the code',
			...(facts.llmsDriftChecks.length > 0 ? { detail: facts.llmsDriftChecks } : {}),
			fix: 'Add a `--check` mode to the generator and chain it into the verify command.',
			handoff: 'llms-txt',
		},
		{
			id: 'llms-accurate',
			area: 'llms-txt',
			level: 4,
			gate: true,
			effort: 2,
			status: hasLlms ? 'judge' : 'n/a',
			summary: '`llms.txt` matches the current public API',
			fix: 'Regenerate it from the public surface.',
			handoff: 'llms-txt',
		},
		{
			id: 'deprecations-marked',
			area: 'api',
			level: 4,
			gate: false,
			effort: 1,
			status: scanned ? 'judge' : 'n/a',
			summary: 'APIs on their way out are marked `@deprecated` before they are removed',
			...(scanned ? { detail: [`${facts.deprecatedTags} @deprecated tag(s) in the declarations`] } : {}),
			fix: 'Mark the old API `@deprecated` with its replacement for a release before removing it.',
		},
	]
}

export function scorePackage(facts: PackageFacts): PackageScoreResult {
	const checks = buildPackageChecks(facts)
	const level = gatedLevel(checks, PACKAGE_MAX_LEVEL)
	return {
		package: facts.name,
		level,
		levelName: PACKAGE_LEVELS[level] as string,
		checks,
		areas: areaScores(checks, PACKAGE_WEIGHTS),
		topFixes: rankFixes(checks, level, PACKAGE_WEIGHTS).slice(0, 3),
		pendingJudgments: checks.filter((c) => c.status === 'judge' && c.gate && c.level <= level),
		surface: {
			// ESM and CJS builds each declare the same symbol; count it once.
			exports: new Set(facts.exportedSymbols.map((s) => s.name)).size,
			declarationFiles: facts.declarationFiles.length,
			declarationTokens: facts.declarationTokens,
		},
		shippedSkills: facts.shippedSkills,
		weights: PACKAGE_WEIGHTS,
	}
}

export function formatPackageReport(result: PackageScoreResult): string {
	const lines: string[] = []
	lines.push(
		`Package ${result.package ?? '(unnamed)'}: level ${result.level} of ${PACKAGE_MAX_LEVEL}: ${result.levelName}`,
	)
	if (result.pendingJudgments.length > 0) {
		lines.push(
			`  provisional: ${result.pendingJudgments.length} gate(s) marked JUDGE need a decision, and a fail lowers it`,
		)
	}
	lines.push('')
	lines.push('Fix first:')
	if (result.topFixes.length === 0) lines.push('  nothing the script can see')
	result.topFixes.forEach((c, i) => {
		lines.push(`  ${i + 1}. [${c.area}] ${c.summary}`)
		if (c.fix) lines.push(`     ${c.fix}${c.handoff ? ` (owner: ${c.handoff})` : ''}`)
	})
	lines.push('')
	const s = result.surface
	lines.push(
		`Public surface (reported, not scored): ${s.exports} exported symbol(s), ~${s.declarationTokens} tokens in ${s.declarationFiles} declaration file(s)`,
	)
	lines.push(
		`Shipped agent skill (checked, not required): ${result.shippedSkills.length > 0 ? result.shippedSkills.join(', ') : 'none'}`,
	)
	lines.push('')
	lines.push('Areas (weight: score):')
	for (const a of result.areas) {
		const score = a.score === undefined ? 'n/a' : `${a.score}% (${a.passed}/${a.total})`
		lines.push(`  ${a.area.padEnd(16)} ${String(a.weight).padStart(2)}: ${score}`)
	}
	lines.push('')
	lines.push('Checks:')
	for (const c of result.checks) {
		const mark = { pass: 'ok  ', fail: 'FAIL', judge: 'JUDGE', 'n/a': 'n/a ' }[c.status]
		lines.push(`  ${mark.padEnd(5)} L${c.level}${c.gate ? '*' : ' '} ${c.id}: ${c.summary}`)
		for (const d of c.detail ?? []) lines.push(`             ${d}`)
	}
	lines.push('')
	lines.push('* gate. Weights are starting estimates, not measured values.')
	return `${lines.join('\n')}\n`
}
