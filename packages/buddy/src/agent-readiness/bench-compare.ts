/**
 * Compares two bench records, task by task and pooled, with the spread and an exact permutation test.
 *
 * A bench runs each task 3-5 times, and agent runs vary a lot from one to the next, so a median moving
 * by 10% is often noise. Each metric therefore carries its min-max on both sides and a two-sided
 * permutation p-value: how often relabelling the runs at random moves the mean at least as far as the
 * real labels did. With 5 runs a side there are only 252 relabellings, so every one is enumerated.
 *
 * The pooled row is the geometric mean of the per-task ratios (after/before means), so a cheap task and
 * an expensive one weigh the same. Its p-value permutes the labels within each task, never across.
 *
 * Both `bench compare` and the comparison a bench run prints against its baseline go through here.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { type BenchSummary, type RunnerName, type RunResult, SCHEMA_VERSION } from './bench.js'

/** What a comparison reads: a results file, or a baseline (which keeps the summary but not the runs). */
export interface ComparableRecord {
	/** Absent on version 1. See `references/bench-results.md`. */
	schemaVersion?: number
	createdAt: string
	/** The commit benched: HEAD, or the `--ref` commit. */
	commit: string | undefined
	/** The commit the task set came from; absent on version 1. */
	taskSetCommit?: string | undefined
	model: string
	harness: string
	/** Absent on a baseline written before the runner was recorded: those ran `claude -p`. */
	runner?: RunnerName
	runsPerTask: number
	summary: BenchSummary
	results?: RunResult[]
}

const METRICS = ['inputTokens', 'outputTokens', 'cacheReadTokens', 'turns', 'toolCalls', 'wallMs', 'costUsd'] as const
type Metric = (typeof METRICS)[number]

/** A p-value below this is what "significant" means in the output. */
const ALPHA = 0.05
/** Enumerate every relabelling up to this many; past it, sample this many at random instead. */
const EXACT_LIMIT = 200_000
const SAMPLES = 20_000

interface MetricDelta {
	metric: Metric
	/** Means, before and after. A side read from a baseline has a mean for cost only. */
	mean: [number | undefined, number | undefined]
	median: [number | undefined, number | undefined]
	/** The relative change of the mean (0.1 is +10%); `undefined` when either side lacks it or before is 0. */
	meanChange: number | undefined
	medianChange: number | undefined
	/** Min-max per side; only when both sides kept their runs. */
	range?: [[number, number], [number, number]]
	test?: PermutationTest
}

interface PermutationTest {
	p: number
	/** Every relabelling was enumerated; otherwise `p` comes from random relabellings. */
	exact: boolean
	/** The smallest p these runs could produce. Above ALPHA, no result here could be called. */
	minP: number
	tooFew: boolean
}

interface TaskComparison {
	task: string
	runs: [number, number]
	passes: [number, number]
	/** Runs that reported an error, such as a failed setup: left out of every metric. */
	errors: [number, number]
	capped: [number, number]
	metrics: MetricDelta[]
}

interface PooledDelta {
	metric: Metric
	/** The geometric mean of the per-task ratios, as a relative change. */
	change: number | undefined
	/** How many tasks the pool covers; a task with a zero on either side has no ratio and is left out. */
	tasks: number
	test?: PermutationTest
}

/** Which bench a side of the comparison is. */
interface SideInfo {
	createdAt: string
	commit: string | undefined
	taskSetCommit: string | undefined
	runsPerTask: number
}

export interface RecordComparison {
	/** Why the two measure different things (another model, harness, or runner), when they do. */
	incomparable?: string
	before: SideInfo
	after: SideInfo
	/** Both record their task set's commit, and the commits differ: the tasks may have changed. */
	taskSetsDiffer: boolean
	/** Both sides kept their per-run results, so spread and p-values are available. */
	perRun: boolean
	passRate: [number, number]
	costPerSuccessUsd: [number | undefined, number | undefined]
	tasks: TaskComparison[]
	pooled: PooledDelta[]
	/** How many p-values the comparison holds: the multiple-comparisons denominator. */
	tests: number
}

interface Side {
	runs: number
	passes: number
	errors: number
	capped: number
	values?: Record<Metric, number[]>
	mean: Partial<Record<Metric, number>>
	median: Partial<Record<Metric, number>>
}

export function median(values: number[]): number {
	if (values.length === 0) return 0
	const sorted = [...values].sort((a, b) => a - b)
	const mid = Math.floor(sorted.length / 2)
	return sorted.length % 2 ? (sorted[mid] as number) : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2
}

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)
const mean = (xs: number[]) => sum(xs) / xs.length

function sidesOf(record: ComparableRecord): Map<string, Side> {
	const sides = new Map<string, Side>()
	if (record.results) {
		for (const task of new Set(record.results.map((r) => r.task))) {
			const rs = record.results.filter((r) => r.task === task)
			const ok = rs.filter((r) => r.error === undefined)
			const values = Object.fromEntries(METRICS.map((m) => [m, ok.map((r) => r[m])])) as Record<Metric, number[]>
			const has = (m: Metric) => values[m].length > 0
			sides.set(task, {
				runs: rs.length,
				passes: rs.filter((r) => r.pass).length,
				errors: rs.length - ok.length,
				capped: rs.filter((r) => r.capped).length,
				values,
				mean: Object.fromEntries(METRICS.filter(has).map((m) => [m, mean(values[m])])),
				median: Object.fromEntries(METRICS.filter(has).map((m) => [m, median(values[m])])),
			})
		}
		return sides
	}
	for (const t of record.summary.tasks) {
		sides.set(t.task, {
			runs: t.runs,
			passes: t.passes,
			errors: t.errors ?? 0,
			capped: t.capped ?? 0,
			mean: { costUsd: t.totalCostUsd / t.runs },
			median: {
				inputTokens: t.medianInputTokens,
				outputTokens: t.medianOutputTokens,
				cacheReadTokens: t.medianCacheReadTokens,
				turns: t.medianTurns,
				toolCalls: t.medianToolCalls,
				wallMs: t.medianWallMs,
			},
		})
	}
	return sides
}

/** A small seeded generator, so a sampled p-value is the same on every run of the same files. */
function rng(seed = 0x9e3779b9) {
	let s = seed >>> 0
	return () => {
		s = (s + 0x6d2b79f5) >>> 0
		let t = s
		t = Math.imul(t ^ (t >>> 15), t | 1)
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296
	}
}

function choose(n: number, k: number): number {
	let c = 1
	for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i
	return Math.round(c)
}

interface Relabellings {
	stats: number[]
	exact: boolean
	/** The smallest p any data could reach with these group sizes. */
	minP: number
}

/**
 * Every way to split the pooled runs into a "before" group of `na` and an "after" group of the rest,
 * as the statistic `stat(beforeMean, afterMean)` of each split. Enumerated when there are few enough,
 * sampled otherwise.
 */
function relabellings(
	a: number[],
	b: number[],
	stat: (before: number, after: number) => number,
	random: () => number,
): Relabellings {
	const all = [...a, ...b]
	const na = a.length
	const nb = b.length
	const total = sum(all)
	const stats: number[] = []
	const split = (before: number) => stat(before / na, (total - before) / nb)
	if (choose(all.length, na) <= EXACT_LIMIT) {
		const walk = (from: number, left: number, acc: number) => {
			if (left === 0) {
				stats.push(split(acc))
				return
			}
			for (let i = from; i <= all.length - left; i++) walk(i + 1, left - 1, acc + (all[i] as number))
		}
		walk(0, na, 0)
		// Only the real split and, with equal groups, its mirror can be the most extreme one.
		return { stats, exact: true, minP: (na === nb ? 2 : 1) / stats.length }
	}
	const idx = all.map((_, i) => i)
	for (let n = 0; n < SAMPLES; n++) {
		// A partial Fisher-Yates shuffle: the first `na` slots are a uniform random "before" group.
		let acc = 0
		for (let i = 0; i < na; i++) {
			const j = i + Math.floor(random() * (idx.length - i))
			;[idx[i], idx[j]] = [idx[j] as number, idx[i] as number]
			acc += all[idx[i] as number] as number
		}
		stats.push(split(acc))
	}
	return { stats, exact: false, minP: 1 / (SAMPLES + 1) }
}

/** Two-sided: the share of relabellings whose |statistic| reaches the observed one. */
function pValue(observed: number, { stats, exact, minP }: Relabellings): PermutationTest {
	const reach = (x: number) => Math.abs(x) >= Math.abs(observed) - 1e-12 * Math.max(1, Math.abs(observed))
	const hits = stats.filter(reach).length
	// A sampled test counts the real split once more: it is one of the possible ones.
	const p = exact ? hits / stats.length : (hits + 1) / (stats.length + 1)
	return { p, exact, minP, tooFew: minP > ALPHA }
}

const difference = (before: number, after: number) => after - before
const logRatio = (before: number, after: number) => Math.log(after / before)

function change(before: number | undefined, after: number | undefined): number | undefined {
	if (before === undefined || after === undefined || before === 0) return undefined
	return after / before - 1
}

function metricDelta(metric: Metric, a: Side, b: Side, random: () => number): MetricDelta {
	const delta: MetricDelta = {
		metric,
		mean: [a.mean[metric], b.mean[metric]],
		median: [a.median[metric], b.median[metric]],
		meanChange: change(a.mean[metric], b.mean[metric]),
		medianChange: change(a.median[metric], b.median[metric]),
	}
	const va = a.values?.[metric]
	const vb = b.values?.[metric]
	if (!va?.length || !vb?.length) return delta
	delta.range = [
		[Math.min(...va), Math.max(...va)],
		[Math.min(...vb), Math.max(...vb)],
	]
	delta.test = pValue(difference(mean(va), mean(vb)), relabellings(va, vb, difference, random))
	return delta
}

function pooledDelta(metric: Metric, pairs: Array<[Side, Side]>, random: () => number): PooledDelta {
	const usable = pairs.flatMap(([a, b]): Array<[number[], number[]]> => {
		const va = a.values?.[metric]
		const vb = b.values?.[metric]
		if (va?.length && vb?.length) return va.every((x) => x > 0) && vb.every((x) => x > 0) ? [[va, vb]] : []
		const ma = a.mean[metric]
		const mb = b.mean[metric]
		return ma && mb ? [[[ma], [mb]]] : []
	})
	if (usable.length === 0) return { metric, change: undefined, tasks: 0 }
	const observed = mean(usable.map(([va, vb]) => logRatio(mean(va), mean(vb))))
	const pooled: PooledDelta = { metric, change: Math.exp(observed) - 1, tasks: usable.length }
	if (!pairs.every(([a, b]) => a.values && b.values)) return pooled

	const perTask = usable.map(([va, vb]) => relabellings(va, vb, logRatio, random))
	const size = perTask.reduce((n, t) => n * t.stats.length, 1)
	const stats: number[] = []
	const exact = perTask.every((t) => t.exact) && size <= EXACT_LIMIT
	if (exact) {
		const walk = (i: number, acc: number) => {
			if (i === perTask.length) {
				stats.push(acc / perTask.length)
				return
			}
			for (const s of (perTask[i] as { stats: number[] }).stats) walk(i + 1, acc + s)
		}
		walk(0, 0)
	} else {
		for (let n = 0; n < SAMPLES; n++) {
			stats.push(mean(perTask.map((t) => t.stats[Math.floor(random() * t.stats.length)] as number)))
		}
	}
	const symmetric = usable.every(([va, vb]) => va.length === vb.length)
	const minP = exact ? (symmetric ? 2 : 1) / stats.length : 1 / (SAMPLES + 1)
	pooled.test = pValue(observed, { stats, exact, minP })
	return pooled
}

function runnerOf(r: ComparableRecord): RunnerName {
	return r.runner ?? 'print'
}

function sideInfo(r: ComparableRecord): SideInfo {
	return { createdAt: r.createdAt, commit: r.commit, taskSetCommit: r.taskSetCommit, runsPerTask: r.runsPerTask }
}

/** Compares `after` against `before`. Never refuses: a model or runner mismatch is named in `incomparable`. */
export function compareRecords(before: ComparableRecord, after: ComparableRecord): RecordComparison {
	const a = { ...before, runner: runnerOf(before) }
	const b = { ...after, runner: runnerOf(after) }
	const mismatch = (['model', 'harness', 'runner'] as const).find((k) => a[k] !== b[k])
	const sa = sidesOf(before)
	const sb = sidesOf(after)
	const random = rng()
	const tasks: TaskComparison[] = []
	const pairs: Array<[Side, Side]> = []
	for (const [task, right] of sb) {
		const left = sa.get(task)
		if (!left) continue
		pairs.push([left, right])
		tasks.push({
			task,
			runs: [left.runs, right.runs],
			passes: [left.passes, right.passes],
			errors: [left.errors, right.errors],
			capped: [left.capped, right.capped],
			metrics: METRICS.map((m) => metricDelta(m, left, right, random)),
		})
	}
	const pooled = METRICS.map((m) => pooledDelta(m, pairs, random))
	const tests =
		tasks.reduce((n, t) => n + t.metrics.filter((m) => m.test).length, 0) + pooled.filter((p) => p.test).length
	return {
		...(mismatch
			? { incomparable: `the before side ran ${mismatch} "${a[mismatch]}", the after side "${b[mismatch]}"` }
			: {}),
		before: sideInfo(before),
		after: sideInfo(after),
		taskSetsDiffer:
			before.taskSetCommit !== undefined &&
			after.taskSetCommit !== undefined &&
			before.taskSetCommit !== after.taskSetCommit,
		perRun: before.results !== undefined && after.results !== undefined,
		passRate: [before.summary.passRate, after.summary.passRate],
		costPerSuccessUsd: [before.summary.costPerSuccessUsd, after.summary.costPerSuccessUsd],
		tasks,
		pooled,
		tests,
	}
}

export class RecordError extends Error {}

/** Where a bench run stores its results, named after its `createdAt`. */
export function resultsFileName(createdAt: string): string {
	return `${createdAt.replace(/[:.]/g, '-')}.json`
}

/**
 * Reads a results file or a baseline. A baseline keeps only the summary, so its runs are looked up in
 * the results file the same bench wrote beside it, when that is still on this machine.
 */
export function loadRecord(path: string): ComparableRecord {
	if (!existsSync(path)) throw new RecordError(`${path} does not exist`)
	let record: ComparableRecord
	try {
		record = JSON.parse(readFileSync(path, 'utf8'))
	} catch (e) {
		throw new RecordError(`${path} is not valid JSON: ${(e as Error).message}`)
	}
	if (typeof record?.createdAt !== 'string' || !Array.isArray(record.summary?.tasks))
		throw new RecordError(`${path} is not a bench results file or baseline`)
	if (!knownVersion(record))
		throw new RecordError(
			`${path} has schemaVersion ${record.schemaVersion}; this version of the script reads up to ${SCHEMA_VERSION}. Update repobuddy.`,
		)
	if (Array.isArray(record.results)) return record
	return withRuns(record, join(dirname(path), 'results'))
}

/** A file with no `schemaVersion` is version 1; one newer than this script knows is not read. */
function knownVersion(record: ComparableRecord): boolean {
	return record.schemaVersion === undefined || record.schemaVersion <= SCHEMA_VERSION
}

/** Adds the per-run results to a baseline from its results file in `resultsDir`, when that exists. */
export function withRuns(record: ComparableRecord, resultsDir: string): ComparableRecord {
	const path = join(resultsDir, resultsFileName(record.createdAt))
	if (!existsSync(path)) return record
	try {
		const full = JSON.parse(readFileSync(path, 'utf8')) as ComparableRecord
		return full.createdAt === record.createdAt && knownVersion(full) && Array.isArray(full.results)
			? { ...record, results: full.results }
			: record
	} catch {
		return record
	}
}

/**
 * The mean cost of one run of each task, from every stored results file taken on this model and runner.
 * With none on this machine, the baseline's summary stands in. Errored runs are left out: they cost
 * nothing and say nothing about what a run costs.
 */
export function storedCostPerRun(
	resultsDir: string,
	baseline: ComparableRecord | undefined,
	model: string,
	runner: RunnerName,
): { perTask: Map<string, number>; runs: number } {
	const costs = new Map<string, number[]>()
	const files = existsSync(resultsDir) ? readdirSync(resultsDir).filter((f) => f.endsWith('.json')) : []
	for (const file of files) {
		let record: ComparableRecord
		try {
			record = JSON.parse(readFileSync(join(resultsDir, basename(file)), 'utf8'))
		} catch {
			continue
		}
		if (
			record?.model !== model ||
			runnerOf(record) !== runner ||
			!knownVersion(record) ||
			!Array.isArray(record.results)
		)
			continue
		for (const r of record.results) {
			if (r.error !== undefined || typeof r.costUsd !== 'number') continue
			costs.set(r.task, [...(costs.get(r.task) ?? []), r.costUsd])
		}
	}
	if (costs.size > 0) {
		const perTask = new Map([...costs].map(([task, cs]) => [task, mean(cs)]))
		return { perTask, runs: sum([...costs.values()].map((cs) => cs.length)) }
	}
	if (baseline && baseline.model === model && runnerOf(baseline) === runner) {
		const tasks = baseline.summary.tasks.filter((t) => t.runs > 0)
		return {
			perTask: new Map(tasks.map((t) => [t.task, t.totalCostUsd / t.runs])),
			runs: sum(tasks.map((t) => t.runs)),
		}
	}
	return { perTask: new Map(), runs: 0 }
}

const LABELS: Record<Metric, string> = {
	inputTokens: 'input tokens',
	outputTokens: 'output tokens',
	cacheReadTokens: 'cache read',
	turns: 'turns',
	toolCalls: 'tool calls',
	wallMs: 'wall time',
	costUsd: 'cost',
}

function value(metric: Metric, n: number): string {
	if (metric === 'wallMs') return `${Math.round(n / 1000)}s`
	if (metric === 'costUsd') return `$${n.toFixed(3)}`
	if (metric === 'turns' || metric === 'toolCalls') return String(Math.round(n * 10) / 10)
	return String(Math.round(n))
}

function pct(change: number | undefined): string {
	if (change === undefined) return 'n/a'
	const r = Math.round(change * 100)
	return `${r > 0 ? '+' : r < 0 ? '−' : ''}${Math.abs(r)}%`
}

function p(test: PermutationTest | undefined): string {
	if (!test) return ''
	const shown = test.p < 0.001 ? '<0.001' : test.p.toFixed(test.p < 0.01 ? 3 : 2)
	const marks = [test.exact ? '' : 'sampled', test.tooFew ? 'too few runs to call' : ''].filter(Boolean)
	return `, p ${shown}${test.p < ALPHA && !test.tooFew ? ' *' : ''}${marks.length ? ` (${marks.join(', ')})` : ''}`
}

const rate = (passes: number, runs: number) => `${passes}/${runs}`

/** The comparison as report lines, indented by two. */
export function formatComparison(c: RecordComparison): string[] {
	const lines: string[] = []
	if (c.taskSetsDiffer)
		lines.push(
			`  The task sets come from different commits (${short(c.before.taskSetCommit)} → ${short(c.after.taskSetCommit)}): check the tasks did not change, or bench the older commit with --ref.`,
		)
	if (!c.perRun)
		lines.push(
			'  One side has only its summary (a baseline whose results file is not on this machine): medians only, no spread or p-values.',
		)
	for (const t of c.tasks) {
		lines.push(
			`  ${t.task}: passed ${rate(t.passes[0], t.runs[0])} → ${rate(t.passes[1], t.runs[1])}${t.capped[0] + t.capped[1] > 0 ? `; capped ${t.capped[0]} → ${t.capped[1]}` : ''}${t.errors[0] + t.errors[1] > 0 ? `; errored ${t.errors[0]} → ${t.errors[1]} (left out)` : ''}`,
		)
		for (const m of t.metrics) {
			const med = `median ${m.median[0] === undefined ? 'n/a' : value(m.metric, m.median[0])} → ${m.median[1] === undefined ? 'n/a' : value(m.metric, m.median[1])} (${pct(m.medianChange)})`
			const mn = m.meanChange === undefined ? '' : `mean ${pct(m.meanChange)}, `
			const range = m.range
				? `; range ${m.range.map(([lo, hi]) => `${value(m.metric, lo)}–${value(m.metric, hi)}`).join(' → ')}`
				: ''
			lines.push(`    ${LABELS[m.metric]}: ${mn}${med}${range}${p(m.test)}`)
		}
	}
	if (c.tasks.length > 1 || c.pooled.some((x) => x.test)) {
		lines.push('  pooled (geometric mean of the task ratios; runs relabelled within each task):')
		for (const x of c.pooled) {
			if (x.change === undefined) continue
			lines.push(`    ${LABELS[x.metric]}: ${pct(x.change)} over ${x.tasks} task(s)${p(x.test)}`)
		}
	}
	lines.push(
		`  pass rate ${Math.round(c.passRate[0] * 100)}% → ${Math.round(c.passRate[1] * 100)}%; cost per success ${usd(c.costPerSuccessUsd[0])} → ${usd(c.costPerSuccessUsd[1])}`,
	)
	if (c.tests > 0) {
		const expected = Math.round(c.tests * ALPHA * 10) / 10
		lines.push(
			`  p is a two-sided exact permutation test on the mean; * marks p < ${ALPHA}. This holds ${c.tests} tests, so about ${expected} would fall below ${ALPHA} by chance alone: treat a lone * as tentative.`,
		)
	}
	if ([...c.tasks.flatMap((t) => t.metrics.map((m) => m.test)), ...c.pooled.map((x) => x.test)].some((t) => t?.tooFew))
		lines.push(
			`  "too few runs to call": even the most lopsided result these runs allow has p above ${ALPHA}. Run more (--runs) before reading a change into it.`,
		)
	return lines
}

const usd = (n: number | undefined) => (n === undefined ? 'n/a' : `$${n.toFixed(3)}`)

const short = (sha: string | undefined) => sha?.slice(0, 7) ?? 'unknown'

function describe(side: SideInfo): string {
	const tasks =
		side.taskSetCommit !== undefined && side.taskSetCommit !== side.commit
			? `, task set ${short(side.taskSetCommit)}`
			: ''
	return `commit ${short(side.commit)}${tasks}, ${side.runsPerTask} run(s) per task, ${side.createdAt}`
}

export function formatRecordComparison(c: RecordComparison, before: string, after: string): string {
	const lines = [
		`Bench compare: ${before} → ${after}`,
		`  before: ${describe(c.before)}`,
		`  after:  ${describe(c.after)}`,
	]
	if (c.incomparable) lines.push(`  Warning: ${c.incomparable}, so these measure different things.`)
	if (c.tasks.length === 0) lines.push('  No task appears in both.')
	return `${[...lines, ...formatComparison(c)].join('\n')}\n`
}
