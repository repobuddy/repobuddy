/**
 * Converts a results file the old `bench` wrote (schema version 1 or 2) into an ACED measured-layer
 * run record (schema version 3), so `aced-bench compare` can re-read it. ACED reads version 3 only and
 * converts nothing itself: each tool converts its own records.
 *
 * What version 2 never recorded is filled in, and every filled-in value says where it came from:
 *
 * - `arm` is the caller's label (`before`, `after`, ...).
 * - `subject` is the git commit benched.
 * - `taskSetHash` and `evaluated` hash the task set as it is on disk now (`tasks.json` and `checks/`),
 *   so the caller must point at the same task set the runs used. ACED compares only records with the
 *   same hash, so converted records compare with each other, never with a run ACED made.
 * - `adapter` is `repobuddy.bench`: the runs came from this tool's runner, not an ACED adapter.
 *
 * A baseline (no runs of its own) converts only when its results file is still beside it.
 */

import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import type { RunResult } from './bench.js'
import { type ComparableRecord, loadRecord, median, RecordError } from './bench-compare.js'

const ARM_LABEL = /^[A-Za-z0-9][A-Za-z0-9_-]*$/
const SUITE_NAME = /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/

export interface ConvertOptions {
	suite: string
	arm: string
	/** The task-set folder: `tasks.json` and `checks/`. */
	taskSet: string
	/** Paths in the record are relative to this folder, normally the repository root. */
	root: string
}

interface V3Run {
	task: string
	run: number
	pass: boolean
	wallMs: number
	inputTokens: number
	outputTokens: number
	cacheReadTokens: number
	cacheCreationTokens: number
	turns: number
	toolCalls: number
	costUsd: number
	capped: boolean
	error: string | null
	transcript: string | null
}

function files(dir: string): string[] {
	if (!existsSync(dir)) return []
	return readdirSync(dir).flatMap((name) => {
		const path = join(dir, name)
		return statSync(path).isDirectory() ? files(path) : [path]
	})
}

const sha256 = (content: Buffer) => createHash('sha256').update(content).digest('hex')
const round = (n: number) => Math.round(n * 10_000) / 10_000

/** ACED's summary of a set of runs: errored runs count toward totals, never toward medians. */
function summarize(runs: V3Run[]) {
	const passes = runs.filter((r) => r.pass).length
	const ok = runs.filter((r) => !r.error)
	const m = (f: (r: V3Run) => number) => median(ok.map(f))
	const totalCostUsd = round(runs.reduce((s, r) => s + r.costUsd, 0))
	return {
		runs: runs.length,
		passes,
		passRate: runs.length === 0 ? 0 : round(passes / runs.length),
		capped: runs.filter((r) => r.capped).length,
		errors: runs.length - ok.length,
		medianInputTokens: m((r) => r.inputTokens),
		medianOutputTokens: m((r) => r.outputTokens),
		medianCacheReadTokens: m((r) => r.cacheReadTokens),
		medianTurns: m((r) => r.turns),
		medianToolCalls: m((r) => r.toolCalls),
		medianWallMs: m((r) => r.wallMs),
		totalCostUsd,
		...(passes > 0 ? { costPerSuccessUsd: round(totalCostUsd / passes) } : {}),
	}
}

function toRun(r: RunResult): V3Run {
	return {
		task: r.task,
		run: r.run,
		pass: r.pass,
		wallMs: r.wallMs,
		inputTokens: r.inputTokens,
		outputTokens: r.outputTokens,
		cacheReadTokens: r.cacheReadTokens,
		cacheCreationTokens: r.cacheCreationTokens,
		turns: r.turns,
		toolCalls: r.toolCalls,
		costUsd: r.costUsd,
		capped: r.capped,
		error: r.error ?? null,
		transcript: r.transcript ?? null,
	}
}

/** Reads a version-1 or -2 results file and returns its version-3 record. */
export function convertFile(path: string, opts: ConvertOptions) {
	return convertRecord(loadRecord(path), opts)
}

export function convertRecord(record: ComparableRecord, opts: ConvertOptions) {
	if (!SUITE_NAME.test(opts.suite)) throw new RecordError(`suite "${opts.suite}" is not a valid suite name`)
	if (!ARM_LABEL.test(opts.arm)) throw new RecordError(`arm "${opts.arm}" is not a valid arm label`)
	if (!record.results) {
		throw new RecordError(
			'this record keeps no runs (a baseline whose results file is gone); record a new baseline with ACED instead',
		)
	}
	if (!record.commit) throw new RecordError('this record names no commit, so it has no git subject')
	const taskSetFiles = [join(opts.taskSet, 'tasks.json'), ...files(join(opts.taskSet, 'checks'))]
		.filter((f) => existsSync(f))
		.map((f) => ({ path: relative(opts.root, f).split('\\').join('/'), content: readFileSync(f) }))
		.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
	if (!taskSetFiles.some((f) => f.path.endsWith('tasks.json'))) {
		throw new RecordError(`${join(opts.taskSet, 'tasks.json')} does not exist; pass the task set the runs used`)
	}
	const hash = createHash('sha256')
	for (const f of taskSetFiles) hash.update(f.path).update('\0').update(f.content).update('\0')

	const runs = record.results.map(toRun)
	const tasks = [...new Set(runs.map((r) => r.task))]
	return {
		schemaVersion: 3,
		layer: 'measured',
		suite: opts.suite,
		arm: opts.arm,
		subject: { kind: 'git-ref', ref: record.commit, commit: record.commit },
		harness: record.harness,
		adapter: 'repobuddy.bench',
		runner: record.runner ?? 'print',
		taskSetCommit: record.taskSetCommit ?? record.commit,
		taskSetHash: hash.digest('hex'),
		tasks,
		tags: {},
		model: record.model,
		scoring_model: record.model,
		createdAt: record.createdAt,
		evaluated: taskSetFiles.map((f) => ({ path: f.path, sha256: sha256(f.content), kind: 'file' })),
		runs,
		summary: {
			overall: summarize(runs),
			tasks: tasks.map((task) => ({ task, ...summarize(runs.filter((r) => r.task === task)) })),
		},
	}
}
