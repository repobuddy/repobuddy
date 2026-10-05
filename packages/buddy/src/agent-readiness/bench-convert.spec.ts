import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import type { RunResult } from './bench.js'
import type { ComparableRecord } from './bench-compare.js'
import { convertFile, convertRecord } from './bench-convert.js'

let root: string
let taskSet: string

beforeEach(() => {
	root = mkdtempSync(join(tmpdir(), 'agent-readiness-convert-'))
	taskSet = join(root, '.agents/aced/bench/repobuddy.readiness')
	mkdirSync(join(taskSet, 'checks/sub'), { recursive: true })
	writeFileSync(join(taskSet, 'tasks.json'), '{"tasks":[]}')
	writeFileSync(join(taskSet, 'checks/b.mts'), 'b')
	writeFileSync(join(taskSet, 'checks/sub/a.sh'), 'a')
})

afterEach(() => rmSync(root, { recursive: true, force: true }))

function run(task: string, n: number, over: Partial<RunResult> = {}): RunResult {
	return {
		task,
		run: n,
		pass: true,
		wallMs: 1000 * n,
		inputTokens: 10,
		outputTokens: 100 * n,
		cacheReadTokens: 5,
		cacheCreationTokens: 1,
		turns: n,
		toolCalls: n,
		costUsd: 0.1 * n,
		capped: false,
		...over,
	}
}

function v2(results: RunResult[] | undefined, over: Partial<ComparableRecord> = {}): ComparableRecord {
	return {
		schemaVersion: 2,
		createdAt: '2026-10-03T03:36:07.546Z',
		commit: 'c0ffee',
		taskSetCommit: 'f00d',
		model: 'sonnet',
		harness: 'claude-code',
		runner: 'print',
		runsPerTask: 2,
		summary: { tasks: [] } as unknown as ComparableRecord['summary'],
		...(results ? { results } : {}),
		...over,
	}
}

const opts = () => ({ suite: 'repobuddy.readiness', arm: 'before', taskSet, root })

describe('convertRecord', () => {
	it('fills in the version-3 fields from what version 2 recorded', () => {
		const record = convertRecord(v2([run('a', 1), run('a', 2), run('b', 1, { transcript: 't.jsonl.gz' })]), opts())
		expect(record).toMatchObject({
			schemaVersion: 3,
			layer: 'measured',
			suite: 'repobuddy.readiness',
			arm: 'before',
			subject: { kind: 'git-ref', ref: 'c0ffee', commit: 'c0ffee' },
			harness: 'claude-code',
			adapter: 'repobuddy.bench',
			runner: 'print',
			taskSetCommit: 'f00d',
			tasks: ['a', 'b'],
			tags: {},
			model: 'sonnet',
			scoring_model: 'sonnet',
			createdAt: '2026-10-03T03:36:07.546Z',
		})
		expect(record.runs[0]).toMatchObject({ task: 'a', error: null, transcript: null })
		expect(record.runs[2]?.transcript).toBe('t.jsonl.gz')
	})

	it('hashes the task set the way ACED does: path-sorted tasks.json and checks/', () => {
		const record = convertRecord(v2([run('a', 1)]), opts())
		const dir = '.agents/aced/bench/repobuddy.readiness'
		const files: Array<[string, string]> = [
			[`${dir}/checks/b.mts`, 'b'],
			[`${dir}/checks/sub/a.sh`, 'a'],
			[`${dir}/tasks.json`, '{"tasks":[]}'],
		]
		const h = createHash('sha256')
		for (const [path, content] of files) h.update(path).update('\0').update(content).update('\0')
		expect(record.taskSetHash).toBe(h.digest('hex'))
		expect(record.evaluated.map((e) => e.path)).toEqual(files.map(([p]) => p))
		expect(record.evaluated[0]).toEqual({
			path: `${dir}/checks/b.mts`,
			sha256: createHash('sha256').update('b').digest('hex'),
			kind: 'file',
		})
	})

	it('summarizes like ACED: errored runs count in totals, never in medians', () => {
		const record = convertRecord(
			v2([run('a', 1), run('a', 3), run('a', 2, { pass: false, error: 'setup failed', costUsd: 0, capped: true })]),
			opts(),
		)
		expect(record.summary.overall).toEqual({
			runs: 3,
			passes: 2,
			passRate: 0.6667,
			capped: 1,
			errors: 1,
			medianInputTokens: 10,
			medianOutputTokens: 200,
			medianCacheReadTokens: 5,
			medianTurns: 2,
			medianToolCalls: 2,
			medianWallMs: 2000,
			totalCostUsd: 0.4,
			costPerSuccessUsd: 0.2,
		})
		expect(record.summary.tasks).toHaveLength(1)
		expect(convertRecord(v2([run('a', 1, { pass: false })]), opts()).summary.overall).not.toHaveProperty(
			'costPerSuccessUsd',
		)
	})

	it('reads a version-1 record: no taskSetCommit, no runner', () => {
		const { schemaVersion: _, taskSetCommit: __, runner: ___, ...v1 } = v2([run('a', 1)])
		expect(convertRecord(v1 as ComparableRecord, opts())).toMatchObject({ taskSetCommit: 'c0ffee', runner: 'print' })
	})

	it.each([
		[{ suite: 'Bad Suite' }, /not a valid suite name/],
		[{ arm: '-x' }, /not a valid arm label/],
		[{ taskSet: join(tmpdir(), 'no-such-task-set') }, /tasks\.json does not exist/],
	])('refuses %j', (over, message) => {
		expect(() => convertRecord(v2([run('a', 1)]), { ...opts(), ...over })).toThrow(message)
	})

	it('refuses a record with no runs or no commit', () => {
		expect(() => convertRecord(v2(undefined), opts())).toThrow(/keeps no runs/)
		expect(() => convertRecord(v2([run('a', 1)], { commit: undefined }), opts())).toThrow(/names no commit/)
	})
})

describe('convertFile', () => {
	it('reads a results file from disk', () => {
		const path = join(root, 'r.json')
		writeFileSync(path, JSON.stringify(v2([run('a', 1)])))
		expect(convertFile(path, opts()).arm).toBe('before')
	})
})
