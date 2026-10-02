/**
 * Runs a repository's fixed agent task set and records what each run cost.
 *
 * Each run gets a clean checkout of HEAD (a detached git worktree), runs the task's setup, runs the
 * agent, then runs the task's check: exit 0 is a pass. The agent runs headless (`claude -p`) by
 * default, or as an interactive session in a terminal multiplexer (`bench-interactive.ts`). The numbers
 * come from the agent's own run report or transcript, so they are the harness's count, not an estimate.
 *
 * The task set lives in the repository at `.agents/readiness/bench/tasks.json`. `--baseline` stores a
 * summary in `baseline.json` beside it; every other run is compared against that baseline.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const BENCH_DIR = '.agents/readiness/bench'
const TASKS_FILE = `${BENCH_DIR}/tasks.json`
export const BASELINE_FILE = `${BENCH_DIR}/baseline.json`
const RESULTS_DIR = `${BENCH_DIR}/results`

/** A baseline older than this no longer counts as measured: the repo has moved on since. */
export const BASELINE_MAX_AGE_DAYS = 90

/** Claude Code is the only harness so far; the name is part of the baseline key. */
const HARNESS = 'claude-code'

/**
 * How the agent is driven: `print` is headless `claude -p`; `interactive` is a real session in a
 * terminal multiplexer pane. They count turns and wall time differently, so the runner is part of the
 * baseline key and a run is never compared against a baseline another runner took.
 */
export type RunnerName = 'print' | 'interactive'

export interface BenchTask {
	id: string
	prompt: string
	/** Shell command run in the checkout after the agent finishes. Exit 0 is a pass. */
	check: string
	/** Shell command run before the agent starts, such as applying a seeded-bug patch. */
	setup?: string
}

export interface BenchConfig {
	/** Fixed for the whole protocol: a baseline taken on one model does not compare with another. */
	model: string
	runs: number
	maxBudgetUsd: number
	/** Passed to the agent as `--permission-mode`. The checkout is throwaway, but the machine is not. */
	permissionMode: string
	timeoutMinutes: number
	/** Shell command run once per checkout before the task's own setup, typically the install. */
	setup?: string
	tasks: BenchTask[]
}

const DEFAULTS = {
	model: 'sonnet',
	runs: 3,
	maxBudgetUsd: 0.5,
	permissionMode: 'bypassPermissions',
	timeoutMinutes: 20,
}

const TASKS_TEMPLATE = {
	model: DEFAULTS.model,
	runs: DEFAULTS.runs,
	maxBudgetUsd: DEFAULTS.maxBudgetUsd,
	setup: 'pnpm install --frozen-lockfile',
	tasks: [
		{
			id: 'fix-seeded-bug',
			prompt: 'The test suite fails. Find the cause and fix it without changing the tests.',
			setup: 'git apply .agents/readiness/bench/fix-seeded-bug.patch',
			check: 'pnpm verify',
		},
		{
			id: 'small-feature',
			prompt: 'Describe one small, self-contained change here, with its acceptance criteria.',
			check: 'pnpm verify',
		},
		{
			id: 'answer-question',
			prompt: 'Ask a question about the code and have the agent write its answer to ANSWER.md.',
			check: 'grep -q "the expected fact" ANSWER.md',
		},
	],
}

export class BenchError extends Error {}

function field(value: unknown, fallback: number, name: string): number {
	if (value === undefined) return fallback
	if (typeof value !== 'number' || !(value > 0))
		throw new BenchError(`${TASKS_FILE}: "${name}" must be a positive number`)
	return value
}

export function parseConfig(text: string): BenchConfig {
	let raw: Partial<Record<keyof BenchConfig, unknown>>
	try {
		raw = JSON.parse(text)
	} catch (e) {
		throw new BenchError(`${TASKS_FILE} is not valid JSON: ${(e as Error).message}`)
	}
	if (!Array.isArray(raw.tasks) || raw.tasks.length === 0)
		throw new BenchError(`${TASKS_FILE}: "tasks" must list at least one task`)
	const ids = new Set<string>()
	const tasks = raw.tasks.map((t: Partial<Record<keyof BenchTask, unknown>>, i: number) => {
		for (const key of ['id', 'prompt', 'check'] as const) {
			if (typeof t?.[key] !== 'string' || t[key] === '')
				throw new BenchError(`${TASKS_FILE}: tasks[${i}] needs a "${key}" string`)
		}
		if (t.setup !== undefined && typeof t.setup !== 'string')
			throw new BenchError(`${TASKS_FILE}: tasks[${i}].setup must be a string`)
		if (ids.has(t.id as string)) throw new BenchError(`${TASKS_FILE}: task id "${t.id}" appears twice`)
		ids.add(t.id as string)
		return t as unknown as BenchTask
	})
	if (raw.setup !== undefined && typeof raw.setup !== 'string')
		throw new BenchError(`${TASKS_FILE}: "setup" must be a string`)
	return {
		model: typeof raw.model === 'string' && raw.model !== '' ? raw.model : DEFAULTS.model,
		runs: Math.floor(field(raw.runs, DEFAULTS.runs, 'runs')),
		maxBudgetUsd: field(raw.maxBudgetUsd, DEFAULTS.maxBudgetUsd, 'maxBudgetUsd'),
		permissionMode: typeof raw.permissionMode === 'string' ? raw.permissionMode : DEFAULTS.permissionMode,
		timeoutMinutes: field(raw.timeoutMinutes, DEFAULTS.timeoutMinutes, 'timeoutMinutes'),
		...(typeof raw.setup === 'string' && raw.setup !== '' ? { setup: raw.setup } : {}),
		tasks,
	}
}

export function loadConfig(dir: string): BenchConfig {
	const path = join(dir, TASKS_FILE)
	if (!existsSync(path))
		throw new BenchError(`no task set: ${TASKS_FILE} does not exist (create one with \`bench --init\`)`)
	return parseConfig(readFileSync(path, 'utf8'))
}

export interface BenchPlan {
	model: string
	harness: string
	runner: RunnerName
	permissionMode: string
	runsPerTask: number
	tasks: string[]
	totalRuns: number
	/** The most the bench can spend: every run hitting its budget cap. */
	ceilingUsd: number
	commit: string | undefined
	/** Uncommitted changes are not in the checkouts the agent works in. */
	dirty: boolean
}

export interface PlanOptions {
	runs?: number
	task?: string
	runner?: Pick<Runner, 'name'>
}

function git(dir: string, args: string[]) {
	return spawnSync('git', args, { cwd: dir, encoding: 'utf8' })
}

function selectTasks(config: BenchConfig, task: string | undefined): BenchTask[] {
	if (task === undefined) return config.tasks
	const found = config.tasks.filter((t) => t.id === task)
	if (found.length === 0)
		throw new BenchError(`no task "${task}" in ${TASKS_FILE} (tasks: ${config.tasks.map((t) => t.id).join(', ')})`)
	return found
}

export function plan(dir: string, config: BenchConfig, opts: PlanOptions = {}): BenchPlan {
	const tasks = selectTasks(config, opts.task)
	const runsPerTask = opts.runs ?? config.runs
	const head = git(dir, ['rev-parse', 'HEAD'])
	const status = git(dir, ['status', '--porcelain'])
	return {
		model: config.model,
		harness: HARNESS,
		runner: opts.runner?.name ?? 'print',
		permissionMode: config.permissionMode,
		runsPerTask,
		tasks: tasks.map((t) => t.id),
		totalRuns: tasks.length * runsPerTask,
		ceilingUsd: round(tasks.length * runsPerTask * config.maxBudgetUsd),
		commit: head.status === 0 ? head.stdout.trim() : undefined,
		dirty: status.status === 0 && status.stdout.trim() !== '',
	}
}

export interface RunMetrics {
	inputTokens: number
	outputTokens: number
	cacheReadTokens: number
	cacheCreationTokens: number
	turns: number
	toolCalls: number
	costUsd: number
	/** The agent stopped on its budget cap, or reported an error, before it finished. */
	capped: boolean
}

/**
 * Reads Claude Code's `--output-format stream-json` transcript: tool calls are counted from the
 * assistant messages, and tokens, turns, and cost come from the closing `result` event.
 */
export function parseStreamJson(text: string): RunMetrics {
	const metrics: RunMetrics = {
		inputTokens: 0,
		outputTokens: 0,
		cacheReadTokens: 0,
		cacheCreationTokens: 0,
		turns: 0,
		toolCalls: 0,
		costUsd: 0,
		capped: true,
	}
	for (const line of text.split('\n')) {
		if (!line.startsWith('{')) continue
		let event: {
			type?: string
			subtype?: string
			is_error?: boolean
			num_turns?: number
			total_cost_usd?: number
			usage?: {
				input_tokens?: number
				output_tokens?: number
				cache_read_input_tokens?: number
				cache_creation_input_tokens?: number
			}
			message?: { content?: Array<{ type?: string }> }
		}
		try {
			event = JSON.parse(line)
		} catch {
			continue
		}
		if (event.type === 'assistant') {
			metrics.toolCalls += (event.message?.content ?? []).filter((c) => c.type === 'tool_use').length
		} else if (event.type === 'result') {
			const u = event.usage ?? {}
			metrics.inputTokens = u.input_tokens ?? 0
			metrics.outputTokens = u.output_tokens ?? 0
			metrics.cacheReadTokens = u.cache_read_input_tokens ?? 0
			metrics.cacheCreationTokens = u.cache_creation_input_tokens ?? 0
			metrics.turns = event.num_turns ?? 0
			metrics.costUsd = event.total_cost_usd ?? 0
			metrics.capped = event.subtype !== 'success' || event.is_error === true
		}
	}
	return metrics
}

export interface RunResult extends RunMetrics {
	task: string
	run: number
	pass: boolean
	wallMs: number
	/** What went wrong in the run, such as a failed setup or an agent session that ended on an error. */
	error?: string
}

export interface ShellResult {
	status: number | null
	stdout: string
}

/** What one agent run reports: its metrics, or why it could not run. */
export interface AgentRun extends RunMetrics {
	error?: string
}

/** The seams a run touches, so tests can drive a run without an agent or a real shell. */
export interface Runner {
	name: RunnerName
	shell(command: string, cwd: string, timeoutMs: number): ShellResult
	/** Runs the agent on the task in the checkout, stopping it at `timeoutMs`. */
	agent(config: BenchConfig, task: BenchTask, checkout: string, timeoutMs: number): AgentRun
	now(): number
}

/* istanbul ignore next -- runs real commands; tests drive runs through a fake Runner */
export function hostShell(command: string, cwd: string, timeoutMs: number): ShellResult {
	const r = spawnSync('sh', ['-c', command], {
		cwd,
		encoding: 'utf8',
		timeout: timeoutMs,
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	return { status: r.status, stdout: r.stdout ?? '' }
}

/* istanbul ignore next -- spawns the real agent; tests drive runs through a fake Runner */
export const printRunner: Runner = {
	name: 'print',
	shell: hostShell,
	agent(config, task, checkout, timeoutMs) {
		const r = spawnSync('claude', agentArgs(config, task, checkout), {
			cwd: checkout,
			encoding: 'utf8',
			timeout: timeoutMs,
			maxBuffer: 256 * 1024 * 1024,
			stdio: ['ignore', 'pipe', 'pipe'],
		})
		return parseStreamJson(r.stdout ?? '')
	},
	now: () => Date.now(),
}

/**
 * The agent sees the repository's own instructions, skills, hooks, and MCP servers, and none of the
 * operator's: the measured cost is the repo's, not the machine's.
 */
export function agentArgs(config: BenchConfig, task: BenchTask, checkout: string): string[] {
	const args = [
		'-p',
		task.prompt,
		'--output-format',
		'stream-json',
		'--verbose',
		'--model',
		config.model,
		'--max-budget-usd',
		String(config.maxBudgetUsd),
		'--permission-mode',
		config.permissionMode,
		'--no-session-persistence',
		'--setting-sources',
		'project',
		'--strict-mcp-config',
	]
	if (existsSync(join(checkout, '.mcp.json'))) args.push('--mcp-config', '.mcp.json')
	return args
}

const SETUP_TIMEOUT_MS = 15 * 60 * 1000

export function runTask(
	dir: string,
	config: BenchConfig,
	task: BenchTask,
	run: number,
	runner: Runner = printRunner,
): RunResult {
	const parent = mkdtempSync(join(tmpdir(), 'agent-readiness-bench-'))
	const checkout = join(parent, 'repo')
	const base = { task: task.id, run }
	const failed = (error: string): RunResult => ({
		...base,
		...parseStreamJson(''),
		capped: false,
		pass: false,
		wallMs: 0,
		error,
	})
	try {
		const add = git(dir, ['worktree', 'add', '--detach', checkout, 'HEAD'])
		if (add.status !== 0) return failed(`git worktree add failed: ${add.stderr.trim()}`)
		for (const [name, command] of [
			['setup', config.setup],
			[`${task.id} setup`, task.setup],
		] as const) {
			if (!command) continue
			if (runner.shell(command, checkout, SETUP_TIMEOUT_MS).status !== 0) return failed(`${name} failed: ${command}`)
		}
		const start = runner.now()
		const agent = runner.agent(config, task, checkout, config.timeoutMinutes * 60 * 1000)
		const wallMs = runner.now() - start
		const pass = runner.shell(task.check, checkout, SETUP_TIMEOUT_MS).status === 0
		return { ...base, ...agent, pass, wallMs }
	} finally {
		git(dir, ['worktree', 'remove', '--force', checkout])
		rmSync(parent, { recursive: true, force: true })
	}
}

interface TaskSummary {
	task: string
	runs: number
	passes: number
	passRate: number
	capped: number
	errors: number
	medianInputTokens: number
	medianOutputTokens: number
	medianCacheReadTokens: number
	medianTurns: number
	medianToolCalls: number
	medianWallMs: number
	totalCostUsd: number
	/** Total spend over the runs that passed: what one success costs. `undefined` when none passed. */
	costPerSuccessUsd: number | undefined
}

export interface BenchSummary {
	tasks: TaskSummary[]
	runs: number
	passes: number
	passRate: number
	totalCostUsd: number
	costPerSuccessUsd: number | undefined
}

function median(values: number[]): number {
	if (values.length === 0) return 0
	const sorted = [...values].sort((a, b) => a - b)
	const mid = Math.floor(sorted.length / 2)
	return sorted.length % 2 ? (sorted[mid] as number) : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2
}

function round(n: number, places = 4): number {
	const f = 10 ** places
	return Math.round(n * f) / f
}

export function summarize(results: RunResult[]): BenchSummary {
	const ids = [...new Set(results.map((r) => r.task))]
	const tasks = ids.map((task): TaskSummary => {
		const rs = results.filter((r) => r.task === task)
		const passes = rs.filter((r) => r.pass).length
		const totalCostUsd = round(rs.reduce((s, r) => s + r.costUsd, 0))
		const m = (f: (r: RunResult) => number) => median(rs.map(f))
		return {
			task,
			runs: rs.length,
			passes,
			passRate: round(passes / rs.length, 2),
			capped: rs.filter((r) => r.capped).length,
			errors: rs.filter((r) => r.error !== undefined).length,
			medianInputTokens: m((r) => r.inputTokens),
			medianOutputTokens: m((r) => r.outputTokens),
			medianCacheReadTokens: m((r) => r.cacheReadTokens),
			medianTurns: m((r) => r.turns),
			medianToolCalls: m((r) => r.toolCalls),
			medianWallMs: m((r) => r.wallMs),
			totalCostUsd,
			costPerSuccessUsd: passes === 0 ? undefined : round(totalCostUsd / passes),
		}
	})
	const passes = results.filter((r) => r.pass).length
	const totalCostUsd = round(results.reduce((s, r) => s + r.costUsd, 0))
	return {
		tasks,
		runs: results.length,
		passes,
		passRate: results.length === 0 ? 0 : round(passes / results.length, 2),
		totalCostUsd,
		costPerSuccessUsd: passes === 0 ? undefined : round(totalCostUsd / passes),
	}
}

export interface BenchRecord {
	createdAt: string
	commit: string | undefined
	model: string
	harness: string
	runner: RunnerName
	runsPerTask: number
	summary: BenchSummary
	results: RunResult[]
}

/** A baseline written before the runner was recorded has no `runner`: it was taken with `claude -p`. */
export type Baseline = Omit<BenchRecord, 'results' | 'runner'> & { runner?: RunnerName }

export function readBaseline(dir: string): Baseline | undefined {
	const path = join(dir, BASELINE_FILE)
	if (!existsSync(path)) return undefined
	try {
		const baseline = JSON.parse(readFileSync(path, 'utf8')) as Baseline
		return typeof baseline.createdAt === 'string' ? baseline : undefined
	} catch {
		return undefined
	}
}

export function baselineAgeDays(baseline: Pick<Baseline, 'createdAt'>, now: Date): number {
	return Math.floor((now.getTime() - new Date(baseline.createdAt).getTime()) / 86_400_000)
}

interface TaskDelta {
	task: string
	passRate: [number, number]
	medianInputTokens: [number, number]
	medianOutputTokens: [number, number]
	medianCacheReadTokens: [number, number]
	medianTurns: [number, number]
	medianToolCalls: [number, number]
	medianWallMs: [number, number]
	costPerSuccessUsd: [number | undefined, number | undefined]
}

export interface Comparison {
	/** Why the two cannot be compared, when they cannot: a different model, harness, or runner measures something else. */
	incomparable?: string
	baselineAgeDays: number
	stale: boolean
	passRate: [number, number]
	costPerSuccessUsd: [number | undefined, number | undefined]
	tasks: TaskDelta[]
}

export function compare(baseline: Baseline, current: BenchRecord, now: Date): Comparison {
	const age = baselineAgeDays(baseline, now)
	// A baseline from before the runner was recorded was taken with `claude -p`.
	const recorded = { ...baseline, runner: baseline.runner ?? 'print' }
	const mismatch = (['model', 'harness', 'runner'] as const).find((k) => recorded[k] !== current[k])
	const tasks = current.summary.tasks.flatMap((c): TaskDelta[] => {
		const b = baseline.summary.tasks.find((t) => t.task === c.task)
		if (!b) return []
		return [
			{
				task: c.task,
				passRate: [b.passRate, c.passRate],
				medianInputTokens: [b.medianInputTokens, c.medianInputTokens],
				medianOutputTokens: [b.medianOutputTokens, c.medianOutputTokens],
				medianCacheReadTokens: [b.medianCacheReadTokens, c.medianCacheReadTokens],
				medianTurns: [b.medianTurns, c.medianTurns],
				medianToolCalls: [b.medianToolCalls, c.medianToolCalls],
				medianWallMs: [b.medianWallMs, c.medianWallMs],
				costPerSuccessUsd: [b.costPerSuccessUsd, c.costPerSuccessUsd],
			},
		]
	})
	return {
		...(mismatch
			? { incomparable: `the baseline ran ${mismatch} "${recorded[mismatch]}", this run "${current[mismatch]}"` }
			: {}),
		baselineAgeDays: age,
		stale: age > BASELINE_MAX_AGE_DAYS,
		passRate: [baseline.summary.passRate, current.summary.passRate],
		costPerSuccessUsd: [baseline.summary.costPerSuccessUsd, current.summary.costPerSuccessUsd],
		tasks,
	}
}

export interface BenchOptions extends PlanOptions {
	baseline?: boolean
	now?: Date
	runner?: Runner
	onRun?: (result: RunResult) => void
}

export interface BenchOutcome {
	record: BenchRecord
	resultsPath: string
	baselinePath?: string
	comparison?: Comparison
}

/** Keeps per-run results out of git; only the baseline is committed. */
function ensureResultsIgnored(dir: string) {
	const path = join(dir, BENCH_DIR, '.gitignore')
	const text = existsSync(path) ? readFileSync(path, 'utf8') : ''
	if (!/^\/?results\/?$/m.test(text))
		writeFileSync(path, `${text}${text && !text.endsWith('\n') ? '\n' : ''}results/\n`)
}

/**
 * The indent the repository formats its bench files with, so a committed `baseline.json` passes its
 * formatter: an existing baseline's (the repo may have reformatted it), else the task set's, which
 * the repo already commits and formats. Tabs, as `bench --init` writes, when neither shows one.
 */
function repoIndent(dir: string): string {
	for (const file of [BASELINE_FILE, TASKS_FILE]) {
		const path = join(dir, file)
		const indent = existsSync(path) ? /^\{\r?\n([ \t]+)"/.exec(readFileSync(path, 'utf8'))?.[1] : undefined
		if (indent) return indent
	}
	return '\t'
}

export function bench(dir: string, config: BenchConfig, opts: BenchOptions = {}): BenchOutcome {
	const now = opts.now ?? new Date()
	const p = plan(dir, config, opts)
	const tasks = selectTasks(config, opts.task)
	const results: RunResult[] = []
	for (const task of tasks) {
		for (let run = 1; run <= p.runsPerTask; run++) {
			const result = runTask(dir, config, task, run, opts.runner)
			results.push(result)
			opts.onRun?.(result)
		}
	}
	const record: BenchRecord = {
		createdAt: now.toISOString(),
		commit: p.commit,
		model: config.model,
		harness: HARNESS,
		runner: p.runner,
		runsPerTask: p.runsPerTask,
		summary: summarize(results),
		results,
	}
	mkdirSync(join(dir, RESULTS_DIR), { recursive: true })
	ensureResultsIgnored(dir)
	const resultsPath = `${RESULTS_DIR}/${record.createdAt.replace(/[:.]/g, '-')}.json`
	writeFileSync(join(dir, resultsPath), `${JSON.stringify(record, null, 2)}\n`)

	if (opts.baseline) {
		const { results: _, ...baseline } = record
		writeFileSync(join(dir, BASELINE_FILE), `${JSON.stringify(baseline, null, repoIndent(dir))}\n`)
		return { record, resultsPath, baselinePath: BASELINE_FILE }
	}
	const baseline = readBaseline(dir)
	return { record, resultsPath, ...(baseline ? { comparison: compare(baseline, record, now) } : {}) }
}

export function initTasks(dir: string): string {
	const path = join(dir, TASKS_FILE)
	if (existsSync(path)) throw new BenchError(`${TASKS_FILE} already exists`)
	mkdirSync(join(dir, BENCH_DIR), { recursive: true })
	writeFileSync(path, `${JSON.stringify(TASKS_TEMPLATE, null, '\t')}\n`)
	ensureResultsIgnored(dir)
	return TASKS_FILE
}

const usd = (n: number | undefined) => (n === undefined ? 'n/a' : `$${n.toFixed(2)}`)
const secs = (ms: number) => `${Math.round(ms / 1000)}s`

export function formatPlan(p: BenchPlan): string {
	const lines = [
		`Bench plan: ${p.tasks.length} task(s) × ${p.runsPerTask} run(s) = ${p.totalRuns} agent run(s)`,
		`  tasks: ${p.tasks.join(', ')}`,
		`  model: ${p.model} (${p.harness}, ${p.runner} runner), permission mode: ${p.permissionMode}`,
		`  commit: ${p.commit ?? 'unknown'}${p.dirty ? ' (uncommitted changes are NOT benched: each run checks out HEAD)' : ''}`,
		`  spend ceiling: ${usd(p.ceilingUsd)} (every run at its budget cap)`,
		'',
		'Nothing has run. Re-run with --yes to spend it.',
	]
	return `${lines.join('\n')}\n`
}

function delta(pair: [number | undefined, number | undefined], fmt: (n: number) => string): string {
	const [b, c] = pair
	if (b === undefined || c === undefined)
		return `${b === undefined ? 'n/a' : fmt(b)} → ${c === undefined ? 'n/a' : fmt(c)}`
	const pct = b === 0 ? '' : ` (${c >= b ? '+' : ''}${Math.round(((c - b) / b) * 100)}%)`
	return `${fmt(b)} → ${fmt(c)}${pct}`
}

export function formatOutcome(outcome: BenchOutcome): string {
	const { record, comparison } = outcome
	const s = record.summary
	const lines = [
		`Bench: ${s.passes}/${s.runs} passed (${Math.round(s.passRate * 100)}%), spent ${usd(s.totalCostUsd)}, cost per success ${usd(s.costPerSuccessUsd)}`,
		`  model ${record.model} (${record.harness}, ${record.runner} runner), commit ${record.commit ?? 'unknown'}`,
		'',
		'Per task (medians):',
	]
	for (const t of s.tasks) {
		lines.push(
			`  ${t.task}: ${t.passes}/${t.runs} passed; in ${t.medianInputTokens}, out ${t.medianOutputTokens}, cache read ${t.medianCacheReadTokens} tokens; ${t.medianTurns} turns; ${t.medianToolCalls} tool calls; ${secs(t.medianWallMs)}; ${usd(t.costPerSuccessUsd)} per success`,
		)
		if (t.capped > 0) lines.push(`    ${t.capped} run(s) stopped on the budget cap or an error`)
		if (t.errors > 0)
			lines.push(`    ${t.errors} run(s) reported an error, such as a failed setup; see ${outcome.resultsPath}`)
	}
	lines.push('')
	if (outcome.baselinePath)
		lines.push(
			`Baseline written: ${outcome.baselinePath}, indented like the bench files beside it. Run the repo's formatter on it if it has one, then commit it.`,
		)
	else if (!comparison) lines.push('No baseline to compare against. Record one with --baseline.')
	else if (comparison.incomparable) lines.push(`Not compared: ${comparison.incomparable}. Record a new baseline.`)
	else {
		lines.push(
			`Against the baseline (${comparison.baselineAgeDays} days old${comparison.stale ? ', stale: refresh it' : ''}):`,
		)
		lines.push(`  pass rate ${delta(comparison.passRate, (n) => `${Math.round(n * 100)}%`)}`)
		lines.push(`  cost per success ${delta(comparison.costPerSuccessUsd, (n) => usd(n))}`)
		for (const t of comparison.tasks) {
			lines.push(`  ${t.task}:`)
			lines.push(`    pass rate ${delta(t.passRate, (n) => `${Math.round(n * 100)}%`)}`)
			lines.push(
				`    input tokens ${delta(t.medianInputTokens, String)}, output tokens ${delta(t.medianOutputTokens, String)}, cache read ${delta(t.medianCacheReadTokens, String)}`,
			)
			lines.push(
				`    turns ${delta(t.medianTurns, String)}, tool calls ${delta(t.medianToolCalls, String)}, wall ${delta(t.medianWallMs, secs)}`,
			)
			lines.push(`    cost per success ${delta(t.costPerSuccessUsd, (n) => usd(n))}`)
		}
	}
	lines.push(`Results: ${outcome.resultsPath}`)
	return `${lines.join('\n')}\n`
}
