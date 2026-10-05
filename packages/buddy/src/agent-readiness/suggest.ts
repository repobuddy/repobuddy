/**
 * Suggests a repo's area-weight override from ACED bench comparisons (#752). A suggestion only:
 * nothing here writes a file.
 *
 * ACED's measured layer writes a comparison record per `aced-bench compare`, and copies the caller's
 * `--tag` pairs into it verbatim. Readiness stamps the area a change touched (`--tag area=noise`) and
 * reads back the records of suite `repobuddy.readiness` that carry one. Per area:
 *
 * - **Effects.** A record shows a *pass* effect when a task's pass rate moved at p < 0.05 (and the
 *   run count can reach that), all such tasks the same way. It shows an *effort* effect when a
 *   pooled token or turn row (input tokens, output tokens, turns, tool calls) moved the same way.
 *   Dollars never decide: the pooled cost row is shown as evidence only. Wall time is left out too,
 *   since API load moves it as much as the repo does.
 * - **Replication.** An effect counts only when two or more records show it in the same direction
 *   and none shows it the other way. One bench of the first pilot found pooled cost +1%, the next
 *   −6% (p 0.008): a single record is not enough.
 * - **Step.** Each replicated effect votes +1 (the area's change helped: raise its weight) or −1.
 *   A net vote moves the weight one bounded step of 5, clamped to 0–40; pass rate and effort count
 *   the same. No vote, or votes that cancel, is "keep the weight": a null result is a finding too.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { OVERRIDE_FILE } from './config.js'
import { AREA_WEIGHTS, type WeightedArea, type Weights } from './score.js'

const SUITE = 'repobuddy.readiness'
export const COMPARISONS_DIR = `.agents/aced/results/bench/${SUITE}`
/** The only comparison-record version readiness knows; it refuses any other rather than guess. */
const SCHEMA_VERSION = 3
const ALPHA = 0.05
const STEP = 5
const MIN_WEIGHT = 0
const MAX_WEIGHT = 40
const EFFORT_METRICS = ['inputTokens', 'outputTokens', 'turns', 'toolCalls'] as const

interface Side {
	n: number
	mean: number
}

/** The fields of an ACED comparison row readiness reads. */
interface Row {
	scope: 'task' | 'pooled'
	task?: string
	metric: string
	before?: Side | null
	after?: Side | null
	change?: number | null
	p?: number
	tooFew?: boolean
	significant?: boolean
}

interface ComparisonRecord {
	schemaVersion: number
	kind: 'comparison'
	suite: string
	createdAt: string
	tags: Record<string, string>
	verdict: string
	incomparable: Array<{ message: string }>
	rows: Row[]
}

export class SuggestError extends Error {}

/** A wrong-version or malformed record stops the run: it may hold evidence that would change the answer. */
export function loadComparison(path: string): ComparisonRecord {
	let record: Partial<ComparisonRecord>
	try {
		record = JSON.parse(readFileSync(path, 'utf8'))
	} catch (e) {
		throw new SuggestError(`${path}: not readable JSON (${(e as Error).message})`)
	}
	if (record?.kind !== 'comparison') throw new SuggestError(`${path}: not an ACED comparison record`)
	if (record.schemaVersion !== SCHEMA_VERSION) {
		throw new SuggestError(
			`${path}: comparison schema version ${record.schemaVersion}; this version of the script reads ${SCHEMA_VERSION} only. Update repobuddy.`,
		)
	}
	if (!Array.isArray(record.rows)) throw new SuggestError(`${path}: has no rows`)
	return record as ComparisonRecord
}

/** Every comparison record of the readiness suite, oldest first. */
export function findComparisons(dir: string): string[] {
	const folder = join(dir, COMPARISONS_DIR)
	if (!existsSync(folder)) return []
	return readdirSync(folder)
		.filter((f) => /^compare-.*\.json$/.test(f))
		.sort()
		.map((f) => join(folder, f))
}

type Direction = 1 | -1

export interface Evidence {
	file: string
	createdAt: string
	verdict: string
	/** Why this record shows no effect it could count; empty when it counted. */
	notes: string[]
	pass?: Direction
	effort?: Direction
	/** Runs per side, smallest over the rows read. */
	runs?: number
	rows: Array<{ task?: string; metric: string; change: number | null; p: number; from?: number; to?: number }>
	/** The pooled cost row: shown, never deciding. */
	cost?: { change: number | null; p: number }
}

export interface Suggestion {
	area: WeightedArea
	current: number
	/** `undefined` keeps the weight. */
	suggested?: number
	reason: string
	/** The override item, for the `## Weights` section of the override file; only with a change. */
	line?: string
	evidence: Evidence[]
}

export interface SuggestResult {
	suite: string
	overrideFile: string
	suggestions: Suggestion[]
	/** Records read but not counted toward any area, and why. */
	skipped: Array<{ file: string; reason: string }>
}

const usable = (r: Row) => r.p !== undefined && r.tooFew === false && r.p < ALPHA

function direction(values: Direction[]): Direction | 'mixed' | undefined {
	if (values.length === 0) return undefined
	return values.every((v) => v === values[0]) ? (values[0] as Direction) : 'mixed'
}

/** The effects one record shows: pass up or effort down helps (+1); the reverse hurts (−1). */
export function readEffects(file: string, record: ComparisonRecord): Evidence {
	const evidence: Evidence = { file, createdAt: record.createdAt, verdict: record.verdict, notes: [], rows: [] }
	const note = (r: Row) =>
		evidence.rows.push({
			...(r.task ? { task: r.task } : {}),
			metric: r.metric,
			change: r.change ?? null,
			p: r.p as number,
			...(r.metric === 'pass' ? { from: (r.before as Side).mean, to: (r.after as Side).mean } : {}),
		})
	// Pooled rows keep no run counts; the task rows do.
	const sizes = record.rows.flatMap((r) => [r.before?.n, r.after?.n]).filter((x): x is number => x !== undefined)

	const pass = record.rows.filter((r) => r.scope === 'task' && r.metric === 'pass' && r.before && r.after)
	const passMoved = pass.filter(usable)
	passMoved.forEach(note)
	const passWay = direction(passMoved.map((r) => ((r.after as Side).mean > (r.before as Side).mean ? 1 : -1)))
	if (passWay === 'mixed') evidence.notes.push('pass rate rose on one task and fell on another')
	else if (passWay) evidence.pass = passWay

	const effort = record.rows.filter(
		(r) =>
			r.scope === 'pooled' && (EFFORT_METRICS as readonly string[]).includes(r.metric) && typeof r.change === 'number',
	)
	const effortMoved = effort.filter(usable)
	effortMoved.forEach(note)
	const effortWay = direction(effortMoved.map((r) => ((r.change as number) < 0 ? 1 : -1)))
	if (effortWay === 'mixed') evidence.notes.push('pooled token and turn rows moved in opposite directions')
	else if (effortWay) evidence.effort = effortWay

	const cost = record.rows.find((r) => r.scope === 'pooled' && r.metric === 'costUsd' && r.p !== undefined)
	if (cost) evidence.cost = { change: cost.change ?? null, p: cost.p as number }
	if (sizes.length > 0) evidence.runs = Math.min(...sizes)
	if (passWay === undefined && effortWay === undefined) {
		const tooFew = [...pass, ...effort].some((r) => r.tooFew)
		evidence.notes.push(tooFew ? 'too few runs to call any change' : 'no significant change in pass rate or effort')
	}
	return evidence
}

/** Two or more records the same way, none the other: the effect's direction. */
function replicated(ways: Array<Direction | undefined>): Direction | undefined {
	const up = ways.filter((w) => w === 1).length
	const down = ways.filter((w) => w === -1).length
	if (up >= 2 && down === 0) return 1
	if (down >= 2 && up === 0) return -1
	return undefined
}

function describe(kind: string, ways: Array<Direction | undefined>): string {
	const up = ways.filter((w) => w === 1).length
	const down = ways.filter((w) => w === -1).length
	if (up > 0 && down > 0) return `${kind}: ${up} record(s) helped, ${down} hurt`
	if (up + down === 1) return `${kind}: one record, not replicated`
	return `${kind}: no effect`
}

export function suggestArea(area: WeightedArea, current: number, evidence: Evidence[]): Suggestion {
	const pass = replicated(evidence.map((e) => e.pass))
	const effort = replicated(evidence.map((e) => e.effort))
	const vote = (pass ?? 0) + (effort ?? 0)
	const why = [
		pass
			? `pass rate ${pass > 0 ? 'rose' : 'fell'} in ${evidence.filter((e) => e.pass === pass).length} records`
			: describe(
					'pass rate',
					evidence.map((e) => e.pass),
				),
		effort
			? `pooled effort ${effort > 0 ? 'fell' : 'rose'} in ${evidence.filter((e) => e.effort === effort).length} records`
			: describe(
					'effort',
					evidence.map((e) => e.effort),
				),
	].join('; ')
	if (vote === 0) {
		const reason =
			pass && effort
				? `keep the weight: the replicated effects disagree (${why})`
				: `keep the weight: no replicated effect (${why})`
		return { area, current, reason, evidence }
	}
	const suggested = Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, current + Math.sign(vote) * STEP))
	if (suggested === current) {
		return {
			area,
			current,
			reason: `keep the weight: already at the ${current === MAX_WEIGHT ? 'maximum' : 'minimum'} (${why})`,
			evidence,
		}
	}
	return {
		area,
		current,
		suggested,
		reason: `${suggested > current ? 'raise' : 'lower'} by ${STEP} (${why})`,
		line: `- ${area}: ${suggested}`,
		evidence,
	}
}

export function suggest(files: string[], weights: Weights, only?: WeightedArea): SuggestResult {
	const byArea = new Map<WeightedArea, Evidence[]>()
	const skipped: SuggestResult['skipped'] = []
	for (const file of files) {
		const record = loadComparison(file)
		const name = basename(file)
		const area = record.tags?.['area']
		if (record.suite !== SUITE) skipped.push({ file: name, reason: `suite ${record.suite}, not ${SUITE}` })
		else if (area === undefined) skipped.push({ file: name, reason: 'no area tag' })
		else if (!(area in AREA_WEIGHTS)) skipped.push({ file: name, reason: `area "${area}" carries no weight` })
		else if (record.verdict === 'incomparable') {
			skipped.push({ file: name, reason: `incomparable: ${record.incomparable.map((r) => r.message).join('; ')}` })
		} else if (only === undefined || area === only) {
			const list = byArea.get(area as WeightedArea) ?? []
			list.push(readEffects(name, record))
			byArea.set(area as WeightedArea, list)
		}
	}
	const areas = (Object.keys(AREA_WEIGHTS) as WeightedArea[]).filter((a) => byArea.has(a) || a === only)
	return {
		suite: SUITE,
		overrideFile: OVERRIDE_FILE,
		suggestions: areas.map((a) => suggestArea(a, weights[a], byArea.get(a) ?? [])),
		skipped,
	}
}

const pct = (change: number | null) =>
	change === null ? 'n/a' : `${change > 0 ? '+' : ''}${Math.round(change * 1000) / 10}%`
const rate = (x: number) => `${Math.round(x * 100)}%`
const pFmt = (p: number) => (p < 0.001 ? '<0.001' : String(Math.round(p * 1000) / 1000))

export function formatSuggestions(result: SuggestResult): string {
	const lines: string[] = []
	if (result.suggestions.length === 0) {
		lines.push(
			`No comparison of suite ${result.suite} is tagged with an area. Compare with \`--tag area=<area>\` to get a suggestion.`,
		)
	}
	const changes = result.suggestions.filter((s) => s.line)
	for (const s of result.suggestions) {
		lines.push(`${s.area} (weight ${s.current}): ${s.suggested === undefined ? '' : `${s.suggested}, `}${s.reason}`)
		for (const e of s.evidence) {
			const rows = e.rows.map(
				(r) =>
					`${r.task ? `${r.task} ` : 'pooled '}${r.metric} ${r.from === undefined ? pct(r.change) : `${rate(r.from)} → ${rate(r.to as number)}`} (p ${pFmt(r.p)})`,
			)
			const cost = e.cost ? `; cost ${pct(e.cost.change)} (p ${pFmt(e.cost.p)}), not deciding` : ''
			lines.push(
				`  - ${e.file}: ${e.verdict}${e.runs === undefined ? '' : `, ${e.runs} runs a side`}${rows.length ? `; ${rows.join(', ')}` : ''}${e.notes.length ? `; ${e.notes.join('; ')}` : ''}${cost}`,
			)
		}
	}
	if (changes.length > 0) {
		lines.push(
			'',
			`To apply, add to the \`## Weights\` section of ${result.overrideFile} (frontmatter \`merge: merge-sections\`):`,
			'',
			...changes.map((s) => s.line as string),
			'',
			'Put the evidence above in the pull request that adds the override. Defaults change only on results across repos.',
		)
	}
	for (const s of result.skipped) lines.push(`skipped ${s.file}: ${s.reason}`)
	return `${lines.join('\n')}\n`
}
