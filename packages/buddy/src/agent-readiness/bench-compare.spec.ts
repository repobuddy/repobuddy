import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from '@jest/globals'
import type { RunResult } from './bench.js'
import { summarize } from './bench.js'
import {
	type ComparableRecord,
	compareRecords,
	formatRecordComparison,
	loadRecord,
	RecordError,
	resultsFileName,
	storedCostPerRun,
} from './bench-compare.js'

const dirs: string[] = []
function tmp() {
	const dir = mkdtempSync(join(tmpdir(), 'agent-readiness-compare-spec-'))
	dirs.push(dir)
	return dir
}
afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

function result(overrides: Partial<RunResult>): RunResult {
	return {
		task: 'a',
		run: 1,
		pass: true,
		wallMs: 1000,
		inputTokens: 100,
		outputTokens: 50,
		cacheReadTokens: 1000,
		cacheCreationTokens: 0,
		turns: 3,
		toolCalls: 2,
		costUsd: 0.07,
		capped: false,
		...overrides,
	}
}

/** One result per value, so `costs` of [1, 2, 3] is three runs costing $1, $2, $3. */
function runs(task: string, costs: number[], extra: Partial<RunResult> = {}): RunResult[] {
	return costs.map((costUsd, i) => result({ task, run: i + 1, costUsd, inputTokens: 100 * costUsd, ...extra }))
}

function record(results: RunResult[], overrides: Partial<ComparableRecord> = {}): ComparableRecord {
	return {
		createdAt: '2026-09-28T00:00:00.000Z',
		commit: 'x',
		model: 'sonnet',
		harness: 'claude-code',
		runner: 'print',
		runsPerTask: 5,
		summary: summarize(results),
		results,
		...overrides,
	}
}

const metric = (c: ReturnType<typeof compareRecords>, task: string, m: string) =>
	c.tasks.find((t) => t.task === task)?.metrics.find((x) => x.metric === m)

describe('compareRecords', () => {
	it('gives the mean and median change, the range, and an exact permutation p-value', () => {
		const c = compareRecords(record(runs('a', [1, 2, 3, 4, 5])), record(runs('a', [6, 7, 8, 9, 10])))
		const cost = metric(c, 'a', 'costUsd')
		expect(cost).toMatchObject({
			mean: [3, 8],
			median: [3, 8],
			range: [
				[1, 5],
				[6, 10],
			],
		})
		expect(cost?.meanChange).toBeCloseTo(5 / 3)
		// Fully separated 5 vs 5: only the real split and its mirror reach it, 2 of C(10,5) = 252.
		expect(cost?.test?.p).toBeCloseTo(2 / 252)
		expect(cost?.test).toMatchObject({ exact: true, tooFew: false })
		expect(c.perRun).toBe(true)
		expect(c.incomparable).toBeUndefined()
	})

	it('flags too few runs when no split could reach significance', () => {
		const c = compareRecords(record(runs('a', [1, 2, 3])), record(runs('a', [6, 7, 8])))
		expect(metric(c, 'a', 'costUsd')?.test).toMatchObject({ p: 0.1, minP: 0.1, tooFew: true })
		expect(formatRecordComparison(c, 'x', 'y')).toMatch(/too few runs to call[\s\S]*Run more \(--runs\)/)
	})

	it('reads no change as p 1', () => {
		const c = compareRecords(record(runs('a', [2, 2, 2, 2])), record(runs('a', [2, 2, 2, 2])))
		expect(metric(c, 'a', 'costUsd')).toMatchObject({ meanChange: 0, test: { p: 1 } })
	})

	it('pools the task ratios as a geometric mean, permuting within each task', () => {
		const c = compareRecords(
			record([...runs('a', [1, 1, 1]), ...runs('b', [10, 10, 10])]),
			record([...runs('a', [2, 2, 2]), ...runs('b', [5, 5, 5])]),
		)
		const cost = c.pooled.find((p) => p.metric === 'costUsd')
		// a doubled, b halved: the geometric mean of 2 and 0.5 is 1.
		expect(cost?.change).toBeCloseTo(0)
		expect(cost?.tasks).toBe(2)
		expect(cost?.test?.exact).toBe(true)

		const same = compareRecords(
			record([...runs('a', [1, 2, 3]), ...runs('b', [1, 2, 3])]),
			record([...runs('a', [4, 5, 6]), ...runs('b', [4, 5, 6])]),
		)
		// Both tasks at their extreme, in either direction: 2 of 20 × 20.
		expect(same.pooled.find((p) => p.metric === 'costUsd')?.test).toMatchObject({ p: 2 / 400, tooFew: false })
	})

	it('samples when there are too many splits to enumerate, deterministically', () => {
		const many = (base: number) => Array.from({ length: 12 }, (_, i) => base + i)
		const run = () => compareRecords(record(runs('a', many(1))), record(runs('a', many(3))))
		const test = metric(run(), 'a', 'costUsd')?.test
		expect(test?.exact).toBe(false)
		expect(test?.p).toBe(metric(run(), 'a', 'costUsd')?.test?.p)
		expect(formatRecordComparison(run(), 'x', 'y')).toMatch(/sampled/)
	})

	it('leaves errored runs out and a task with a zero out of the pool', () => {
		const c = compareRecords(
			record([...runs('a', [1, 2]), result({ task: 'a', run: 3, costUsd: 0, error: 'setup failed' })]),
			record([...runs('a', [1, 2]), ...runs('b', [1])]),
		)
		expect(c.tasks.map((t) => t.task)).toEqual(['a'])
		expect(c.tasks[0]).toMatchObject({ runs: [3, 2], errors: [1, 0] })
		expect(metric(c, 'a', 'costUsd')?.mean).toEqual([1.5, 1.5])
		const wall = compareRecords(record(runs('a', [1], { wallMs: 0 })), record(runs('a', [1])))
		expect(wall.pooled.find((p) => p.metric === 'wallMs')).toMatchObject({ change: undefined, tasks: 0 })
		expect(metric(wall, 'a', 'wallMs')?.meanChange).toBeUndefined()
	})

	it('names a model or runner mismatch but still compares', () => {
		const c = compareRecords(record(runs('a', [1]), { model: 'haiku' }), record(runs('a', [1])))
		expect(c.incomparable).toBe('the before side ran model "haiku", the after side "sonnet"')
		const { runner: _, ...legacy } = record(runs('a', [1]))
		expect(compareRecords(legacy, record(runs('a', [1]))).incomparable).toBeUndefined()
		expect(compareRecords(legacy, record(runs('a', [1]), { runner: 'interactive' })).incomparable).toMatch(/runner/)
		expect(formatRecordComparison(c, 'x', 'y')).toMatch(/Warning: .*different things/)
	})

	it('names each side, and notes task sets from different commits', () => {
		const v2 = (commit: string, taskSetCommit: string) =>
			record(runs('a', [1, 2]), { schemaVersion: 2, commit, taskSetCommit })
		const c = compareRecords(v2('aaaaaaa111', 'ccccccc333'), v2('bbbbbbb222', 'ccccccc333'))
		expect(c.taskSetsDiffer).toBe(false)
		const text = formatRecordComparison(c, 'x', 'y')
		expect(text).toMatch(/ {2}before: commit aaaaaaa, task set ccccccc, 5 run\(s\) per task, 2026-09-28/)
		expect(text).not.toMatch(/different commits/)

		const moved = compareRecords(v2('aaaaaaa111', 'aaaaaaa111'), v2('bbbbbbb222', 'bbbbbbb222'))
		expect(moved.taskSetsDiffer).toBe(true)
		expect(formatRecordComparison(moved, 'x', 'y')).toMatch(
			/after: {2}commit bbbbbbb, 5 run[\s\S]*task sets come from different commits \(aaaaaaa → bbbbbbb\)/,
		)
		// Version 1 has no task set commit, so nothing can be said either way.
		expect(compareRecords(record(runs('a', [1]), { commit: undefined }), v2('b', 'b')).taskSetsDiffer).toBe(false)
		expect(
			formatRecordComparison(compareRecords(record(runs('a', [1]), { commit: undefined }), v2('b', 'b')), 'x', 'y'),
		).toMatch(/before: commit unknown,/)
	})

	it('falls back to medians when a side has only its summary', () => {
		const { results: _, ...summaryOnly } = record(runs('a', [1, 3]))
		const c = compareRecords(summaryOnly, record(runs('a', [2, 2])))
		expect(c.perRun).toBe(false)
		expect(c.tests).toBe(0)
		expect(metric(c, 'a', 'inputTokens')).toMatchObject({ median: [200, 200] })
		expect(metric(c, 'a', 'inputTokens')).not.toHaveProperty('range')
		expect(metric(c, 'a', 'inputTokens')).not.toHaveProperty('test')
		expect(metric(c, 'a', 'costUsd')?.mean).toEqual([2, 2])
		const text = formatRecordComparison(c, 'x', 'y')
		expect(text).toMatch(/medians only, no spread or p-values/)
		expect(text).not.toMatch(/tests/)
	})

	it('prints per task, pooled, and the multiple-comparisons caveat', () => {
		const c = compareRecords(
			record([...runs('a', [1, 2, 3, 4]), ...runs('b', [1, 2, 3, 4], { capped: true })]),
			record([...runs('a', [2, 3, 4, 5]), ...runs('b', [1, 2, 3, 4])]),
		)
		expect(c.tests).toBe(21)
		const text = formatRecordComparison(c, 'before.json', 'after.json')
		expect(text).toMatch(/^Bench compare: before\.json → after\.json\n/)
		expect(text).toMatch(/ {2}a: passed 4\/4 → 4\/4\n/)
		expect(text).toMatch(/ {2}b: passed 4\/4 → 4\/4; capped 4 → 0\n/)
		expect(text).toMatch(
			/cost: mean \+40%, median \$2\.500 → \$3\.500 \(\+40%\); range \$1\.000–\$4\.000 → \$2\.000–\$5\.000, p 0\.\d+/,
		)
		expect(text).toMatch(/pooled \(geometric mean[\s\S]*cost: \+18% over 2 task\(s\)/)
		expect(text).toMatch(/holds 21 tests, so about 1\.1 would fall below 0\.05 by chance alone/)
		expect(formatRecordComparison(compareRecords(record(runs('a', [1])), record(runs('b', [1]))), 'x', 'y')).toMatch(
			/No task appears in both/,
		)
	})
})

describe('loadRecord', () => {
	it('reads a results file, and a baseline with the runs from its results file', () => {
		const dir = tmp()
		const full = record(runs('a', [1, 2]))
		const { results: _, ...baseline } = full
		mkdirSync(join(dir, 'results'))
		writeFileSync(join(dir, 'results', resultsFileName(full.createdAt)), JSON.stringify(full))
		writeFileSync(join(dir, 'baseline.json'), JSON.stringify(baseline))
		expect(loadRecord(join(dir, 'results', resultsFileName(full.createdAt))).results).toHaveLength(2)
		expect(loadRecord(join(dir, 'baseline.json')).results).toHaveLength(2)

		const other = tmp()
		writeFileSync(join(other, 'baseline.json'), JSON.stringify(baseline))
		expect(loadRecord(join(other, 'baseline.json')).results).toBeUndefined()
		mkdirSync(join(other, 'results'))
		writeFileSync(join(other, 'results', resultsFileName(full.createdAt)), '{')
		expect(loadRecord(join(other, 'baseline.json')).results).toBeUndefined()
	})

	it('reads versions 1 and 2, and refuses a newer one', () => {
		const dir = tmp()
		writeFileSync(join(dir, 'v1.json'), JSON.stringify(record(runs('a', [1]))))
		writeFileSync(
			join(dir, 'v2.json'),
			JSON.stringify(record(runs('a', [1]), { schemaVersion: 2, taskSetCommit: 'x' })),
		)
		writeFileSync(join(dir, 'v3.json'), JSON.stringify(record(runs('a', [1]), { schemaVersion: 3 })))
		expect(loadRecord(join(dir, 'v1.json')).results).toHaveLength(1)
		expect(loadRecord(join(dir, 'v2.json')).taskSetCommit).toBe('x')
		expect(() => loadRecord(join(dir, 'v3.json'))).toThrow(/schemaVersion 3; this version of the script reads up to 2/)

		const { results: _, ...baseline } = record(runs('a', [1]))
		mkdirSync(join(dir, 'results'))
		writeFileSync(join(dir, 'baseline.json'), JSON.stringify(baseline))
		writeFileSync(
			join(dir, 'results', resultsFileName(baseline.createdAt)),
			JSON.stringify(record(runs('a', [1]), { schemaVersion: 3 })),
		)
		expect(loadRecord(join(dir, 'baseline.json')).results).toBeUndefined()
	})

	it('names a file it cannot use', () => {
		const dir = tmp()
		writeFileSync(join(dir, 'bad.json'), '{')
		writeFileSync(join(dir, 'other.json'), '{"x":1}')
		expect(() => loadRecord(join(dir, 'missing.json'))).toThrow(RecordError)
		expect(() => loadRecord(join(dir, 'bad.json'))).toThrow(/not valid JSON/)
		expect(() => loadRecord(join(dir, 'other.json'))).toThrow(/not a bench results file or baseline/)
	})
})

describe('storedCostPerRun', () => {
	it('averages each task over stored runs on the same model and runner', () => {
		const dir = tmp()
		writeFileSync(join(dir, '1.json'), JSON.stringify(record(runs('a', [0.06, 0.08]))))
		writeFileSync(
			join(dir, '2.json'),
			JSON.stringify(record([...runs('a', [0.1]), result({ task: 'a', costUsd: 0, error: 'x' })])),
		)
		writeFileSync(join(dir, '3.json'), JSON.stringify(record(runs('a', [9]), { model: 'opus' })))
		writeFileSync(join(dir, '5.json'), JSON.stringify(record(runs('a', [9]), { schemaVersion: 3 })))
		writeFileSync(join(dir, '4.json'), '{')
		writeFileSync(join(dir, 'notes.txt'), 'x')
		const stored = storedCostPerRun(dir, undefined, 'sonnet', 'print')
		expect(stored.runs).toBe(3)
		expect(stored.perTask.get('a')).toBeCloseTo(0.08)
		expect(storedCostPerRun(dir, undefined, 'sonnet', 'interactive').runs).toBe(0)
	})

	it('falls back to the baseline summary, then to nothing', () => {
		const { results: _, ...baseline } = record(runs('a', [0.06, 0.08]))
		const missing = join(tmp(), 'results')
		expect(storedCostPerRun(missing, baseline, 'sonnet', 'print')).toEqual({
			perTask: new Map([['a', 0.07]]),
			runs: 2,
		})
		expect(storedCostPerRun(missing, baseline, 'opus', 'print').runs).toBe(0)
		expect(storedCostPerRun(missing, undefined, 'sonnet', 'print').runs).toBe(0)
	})
})
