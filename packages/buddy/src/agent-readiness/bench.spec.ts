import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from '@jest/globals'
import {
	agentArgs,
	BASELINE_FILE,
	type BenchConfig,
	BenchError,
	bench,
	compare,
	formatOutcome,
	formatPlan,
	initTasks,
	loadConfig,
	parseConfig,
	parseStreamJson,
	plan,
	type Runner,
	type RunResult,
	readBaseline,
	runTask,
	summarize,
} from './bench.js'

const dirs: string[] = []

function repo(files: Record<string, string> = {}) {
	const dir = mkdtempSync(join(tmpdir(), 'agent-readiness-bench-spec-'))
	dirs.push(dir)
	for (const [path, content] of Object.entries({ 'README.md': '# x', ...files })) {
		mkdirSync(dirname(join(dir, path)), { recursive: true })
		writeFileSync(join(dir, path), content)
	}
	const git = (...args: string[]) => spawnSync('git', args, { cwd: dir })
	git('init', '-q')
	git('add', '-A')
	git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'init')
	return dir
}

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

const config: BenchConfig = {
	model: 'sonnet',
	runs: 2,
	maxBudgetUsd: 0.5,
	permissionMode: 'bypassPermissions',
	timeoutMinutes: 20,
	tasks: [
		{ id: 'a', prompt: 'do a', check: 'test -f done' },
		{ id: 'b', prompt: 'do b', check: 'test -f done', setup: 'true' },
	],
}

function transcript({ subtype = 'success', tools = 2, cost = 0.1 } = {}) {
	return [
		JSON.stringify({ type: 'system', subtype: 'init' }),
		JSON.stringify({
			type: 'assistant',
			message: { content: [{ type: 'text' }, ...Array(tools).fill({ type: 'tool_use' })] },
		}),
		'not json',
		'{broken',
		JSON.stringify({
			type: 'result',
			subtype,
			is_error: subtype !== 'success',
			num_turns: 4,
			total_cost_usd: cost,
			usage: { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 1000, cache_creation_input_tokens: 200 },
		}),
	].join('\n')
}

/** Runs no agent: `shell` really runs in the checkout, and the agent "writes" `done` when told to pass. */
function fakeRunner(opts: { pass?: boolean; setupFails?: boolean } = {}): Runner & { calls: string[] } {
	let clock = 0
	const calls: string[] = []
	return {
		name: 'print',
		calls,
		shell(command, cwd) {
			if (opts.setupFails && command === 'true') return { status: 1, stdout: '' }
			return { status: spawnSync('sh', ['-c', command], { cwd }).status, stdout: '' }
		},
		agent(_config, task, checkout) {
			calls.push(task.id)
			if (opts.pass !== false) writeFileSync(join(checkout, 'done'), '')
			return parseStreamJson(transcript())
		},
		now: () => (clock += 1500),
	}
}

function result(overrides: Partial<RunResult>): RunResult {
	return {
		task: 'a',
		run: 1,
		pass: true,
		wallMs: 1000,
		inputTokens: 100,
		outputTokens: 50,
		cacheReadTokens: 0,
		cacheCreationTokens: 0,
		turns: 3,
		toolCalls: 2,
		costUsd: 0.2,
		capped: false,
		...overrides,
	}
}

describe('parseConfig', () => {
	it('fills defaults', () => {
		expect(parseConfig(JSON.stringify({ tasks: [{ id: 'a', prompt: 'p', check: 'c' }] }))).toEqual({
			model: 'sonnet',
			runs: 3,
			maxBudgetUsd: 0.5,
			permissionMode: 'bypassPermissions',
			timeoutMinutes: 20,
			tasks: [{ id: 'a', prompt: 'p', check: 'c' }],
		})
	})

	it.each([
		['{', /not valid JSON/],
		['{}', /at least one task/],
		['{"tasks":[{"id":"a","prompt":"p"}]}', /needs a "check"/],
		['{"tasks":[{"id":"a","prompt":"p","check":"c","setup":1}]}', /setup must be a string/],
		['{"tasks":[{"id":"a","prompt":"p","check":"c"},{"id":"a","prompt":"p","check":"c"}]}', /appears twice/],
		['{"setup":1,"tasks":[{"id":"a","prompt":"p","check":"c"}]}', /"setup" must be a string/],
		['{"runs":0,"tasks":[{"id":"a","prompt":"p","check":"c"}]}', /"runs" must be a positive number/],
	])('rejects %s', (text, message) => {
		expect(() => parseConfig(text)).toThrow(message)
	})
})

describe('loadConfig and initTasks', () => {
	it('explains how to start when there is no task set', () => {
		expect(() => loadConfig(repo())).toThrow(BenchError)
	})

	it('writes a template that loads, and refuses to overwrite it', () => {
		const dir = repo()
		initTasks(dir)
		expect(loadConfig(dir).tasks.length).toBeGreaterThanOrEqual(3)
		expect(readFileSync(join(dir, '.agents/readiness/bench/.gitignore'), 'utf8')).toBe('results/\n')
		expect(() => initTasks(dir)).toThrow(/already exists/)
	})
})

describe('parseStreamJson', () => {
	it('reads usage from the result event and counts tool calls', () => {
		expect(parseStreamJson(transcript())).toEqual({
			inputTokens: 100,
			outputTokens: 50,
			cacheReadTokens: 1000,
			cacheCreationTokens: 200,
			turns: 4,
			toolCalls: 2,
			costUsd: 0.1,
			capped: false,
		})
	})

	it('marks a run that hit its budget, or never reported, as capped', () => {
		expect(parseStreamJson(transcript({ subtype: 'error_max_budget_usd' })).capped).toBe(true)
		expect(parseStreamJson('').capped).toBe(true)
	})

	it('tolerates a result event with no usage', () => {
		expect(parseStreamJson('{"type":"result","subtype":"success"}')).toMatchObject({
			inputTokens: 0,
			turns: 0,
			capped: false,
		})
	})
})

describe('plan', () => {
	it('counts runs and the spend ceiling, and notes uncommitted changes', () => {
		const dir = repo()
		writeFileSync(join(dir, 'README.md'), 'changed')
		const p = plan(dir, config, { runs: 3 })
		expect(p).toMatchObject({
			tasks: ['a', 'b'],
			totalRuns: 6,
			ceilingUsd: 3,
			dirty: true,
			model: 'sonnet',
			runner: 'print',
		})
		expect(p.commit).toMatch(/^[0-9a-f]{40}$/)
		expect(formatPlan(p)).toMatch(/uncommitted changes are NOT benched[\s\S]*\$3\.00[\s\S]*--yes/)
	})

	it('names the runner', () => {
		const p = plan(repo(), config, { runner: { name: 'interactive' } })
		expect(formatPlan(p)).toMatch(/model: sonnet \(claude-code, interactive runner\)/)
	})

	it('narrows to one task, and names the tasks when the id is wrong', () => {
		const dir = repo()
		expect(plan(dir, config, { task: 'b' }).tasks).toEqual(['b'])
		expect(() => plan(dir, config, { task: 'z' })).toThrow(/tasks: a, b/)
	})
})

describe('agentArgs', () => {
	it('pins the model and budget, and loads only the repo settings and MCP servers', () => {
		const dir = repo()
		const args = agentArgs(config, config.tasks[0]!, dir)
		expect(args.slice(0, 2)).toEqual(['-p', 'do a'])
		expect(args).toEqual(
			expect.arrayContaining(['--model', 'sonnet', '--max-budget-usd', '0.5', 'project', '--strict-mcp-config']),
		)
		expect(args).not.toContain('--mcp-config')
		writeFileSync(join(dir, '.mcp.json'), '{}')
		expect(agentArgs(config, config.tasks[0]!, dir)).toEqual(expect.arrayContaining(['--mcp-config', '.mcp.json']))
	})
})

describe('runTask', () => {
	it('runs the agent in a clean checkout and grades it by the check', () => {
		const dir = repo()
		writeFileSync(join(dir, 'done'), '') // uncommitted, so absent from the checkout
		const r = runTask(dir, config, config.tasks[1]!, 1, fakeRunner({ pass: false }))
		expect(r).toMatchObject({ task: 'b', run: 1, pass: false, wallMs: 1500, toolCalls: 2, costUsd: 0.1 })
		expect(
			spawnSync('git', ['worktree', 'list'], { cwd: dir, encoding: 'utf8' }).stdout.trim().split('\n'),
		).toHaveLength(1)
	})

	it('passes when the check does', () => {
		expect(runTask(repo(), config, config.tasks[0]!, 1, fakeRunner()).pass).toBe(true)
	})

	it('reports a setup failure without running the agent', () => {
		const runner = fakeRunner({ setupFails: true })
		const r = runTask(repo(), config, config.tasks[1]!, 1, runner)
		expect(r).toMatchObject({ pass: false, error: 'b setup failed: true' })
		expect(runner.calls).toHaveLength(0)
	})

	it('reports a checkout that cannot be made', () => {
		const dir = mkdtempSync(join(tmpdir(), 'agent-readiness-bench-nogit-'))
		dirs.push(dir)
		expect(runTask(dir, config, config.tasks[0]!, 1, fakeRunner()).error).toMatch(/git worktree add failed/)
	})
})

describe('summarize', () => {
	it('takes medians per task and divides spend by successes', () => {
		const s = summarize([
			result({ run: 1, inputTokens: 100, costUsd: 0.2 }),
			result({ run: 2, inputTokens: 300, costUsd: 0.4, pass: false, capped: true }),
			result({ task: 'b', pass: false, costUsd: 0.1, error: 'x' }),
		])
		expect(s.tasks[0]).toMatchObject({
			task: 'a',
			runs: 2,
			passes: 1,
			passRate: 0.5,
			capped: 1,
			medianInputTokens: 200,
			costPerSuccessUsd: 0.6,
		})
		expect(s.tasks[1]).toMatchObject({ task: 'b', errors: 1, costPerSuccessUsd: undefined })
		expect(s).toMatchObject({ runs: 3, passes: 1, passRate: 0.33, totalCostUsd: 0.7, costPerSuccessUsd: 0.7 })
		expect(summarize([])).toMatchObject({ passRate: 0, costPerSuccessUsd: undefined })
	})
})

describe('bench', () => {
	const now = new Date('2026-09-28T00:00:00Z')

	it('records a baseline, then compares the next run against it', () => {
		const dir = repo()
		const first = bench(dir, config, { baseline: true, now, runner: fakeRunner() })
		expect(first.baselinePath).toBe(BASELINE_FILE)
		expect(existsSync(join(dir, first.resultsPath))).toBe(true)
		expect(readFileSync(join(dir, '.agents/readiness/bench/.gitignore'), 'utf8')).toBe('results/\n')
		expect(readBaseline(dir)).toMatchObject({
			createdAt: now.toISOString(),
			model: 'sonnet',
			harness: 'claude-code',
			runner: 'print',
		})
		expect(readBaseline(dir)).not.toHaveProperty('results')
		expect(formatOutcome(first)).toMatch(/Baseline written/)

		const later = new Date('2027-01-15T00:00:00Z')
		const seen: string[] = []
		const second = bench(dir, config, {
			now: later,
			runner: fakeRunner({ pass: false }),
			onRun: (r) => seen.push(`${r.task}${r.run}`),
		})
		expect(seen).toEqual(['a1', 'a2', 'b1', 'b2'])
		expect(second.comparison).toMatchObject({ stale: true, passRate: [1, 0] })
		expect(formatOutcome(second)).toMatch(/stale: refresh it[\s\S]*pass rate 100% → 0% \(-100%\)[\s\S]*n\/a/)
	})

	it('says there is no baseline yet', () => {
		const outcome = bench(repo(), config, { now, task: 'a', runs: 1, runner: fakeRunner() })
		expect(outcome.comparison).toBeUndefined()
		expect(formatOutcome(outcome)).toMatch(/Record one with --baseline/)
	})

	it('indents the baseline like the task set the repo already formats', () => {
		const dir = repo({ '.agents/readiness/bench/tasks.json': '{\n    "tasks": []\n}\n' })
		bench(dir, config, { baseline: true, now, runs: 1, runner: fakeRunner() })
		expect(readFileSync(join(dir, BASELINE_FILE), 'utf8')).toMatch(/^\{\n {4}"schemaVersion"/)
	})

	it('keeps the indent of an existing baseline, which the repo may have reformatted', () => {
		const dir = repo({
			'.agents/readiness/bench/tasks.json': '{\n  "tasks": []\n}\n',
			[BASELINE_FILE]: '{\n\t"createdAt": "2026-01-01T00:00:00.000Z"\n}\n',
		})
		const outcome = bench(dir, config, { baseline: true, now, runs: 1, runner: fakeRunner() })
		expect(readFileSync(join(dir, BASELINE_FILE), 'utf8')).toMatch(/^\{\n\t"schemaVersion"/)
		expect(formatOutcome(outcome)).toMatch(/Run the repo's formatter on it if it has one, then commit it/)
	})

	it('indents with tabs, as `bench --init` writes, when there is nothing to match', () => {
		const dir = repo()
		bench(dir, config, { baseline: true, now, runs: 1, runner: fakeRunner() })
		expect(readFileSync(join(dir, BASELINE_FILE), 'utf8')).toMatch(/^\{\n\t"schemaVersion"/)
	})

	it('keeps an existing results ignore rule', () => {
		const dir = repo({ '.agents/readiness/bench/.gitignore': 'results/' })
		bench(dir, config, { now, runs: 1, runner: fakeRunner() })
		expect(readFileSync(join(dir, '.agents/readiness/bench/.gitignore'), 'utf8')).toBe('results/')
	})
})

describe('bench --ref', () => {
	const now = new Date('2026-09-28T00:00:00Z')
	const sh = (dir: string, ...args: string[]) => spawnSync('git', args, { cwd: dir, encoding: 'utf8' }).stdout.trim()

	/** A past commit with no task set, then HEAD adding one and changing the code. */
	function history() {
		const dir = repo({ 'code.txt': 'before' })
		const past = sh(dir, 'rev-parse', 'HEAD')
		mkdirSync(join(dir, '.agents/readiness/bench'), { recursive: true })
		writeFileSync(join(dir, '.agents/readiness/bench/tasks.json'), '{}')
		writeFileSync(join(dir, '.agents/readiness/bench/seed.patch'), 'x')
		writeFileSync(join(dir, 'code.txt'), 'after')
		sh(dir, 'add', '-A')
		sh(dir, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'task set')
		return { dir, past, head: sh(dir, 'rev-parse', 'HEAD') }
	}

	it('plans the ref it will bench and the task set it takes from HEAD', () => {
		const { dir, past, head } = history()
		const p = plan(dir, config, { ref: past.slice(0, 7) })
		expect(p).toMatchObject({ ref: past.slice(0, 7), commit: past, taskSetCommit: head })
		expect(formatPlan(p)).toMatch(new RegExp(`commit: ${past} \\(--ref ${past.slice(0, 7)}\\), task set from ${head}`))
		expect(() => plan(dir, config, { ref: 'no-such-ref' })).toThrow(/--ref "no-such-ref" names no commit/)
	})

	it('runs the agent on the ref with the current task set overlaid, and records both commits', () => {
		const { dir, past, head } = history()
		const seen: Array<{ code: string; seed: boolean; status: string; parent: string }> = []
		const runner: Runner = {
			...fakeRunner(),
			agent(_config, _task, checkout) {
				seen.push({
					code: readFileSync(join(checkout, 'code.txt'), 'utf8'),
					seed: existsSync(join(checkout, '.agents/readiness/bench/seed.patch')),
					status: sh(checkout, 'status', '--porcelain'),
					parent: sh(checkout, 'rev-parse', 'HEAD~1'),
				})
				writeFileSync(join(checkout, 'done'), '')
				return parseStreamJson(transcript())
			},
		}
		const outcome = bench(dir, config, { ref: past, now, task: 'a', runs: 1, runner })
		expect(seen).toEqual([{ code: 'before', seed: true, status: '', parent: past }])
		expect(outcome.record).toMatchObject({ schemaVersion: 2, commit: past, taskSetCommit: head })
		expect(outcome.record.results[0]?.pass).toBe(true)
		expect(formatOutcome(outcome)).toMatch(new RegExp(`commit ${past}, task set from ${head}`))
	})

	it('records the same commit for both when benching HEAD', () => {
		const { dir, head } = history()
		const outcome = bench(dir, config, { now, task: 'a', runs: 1, runner: fakeRunner() })
		expect(outcome.record).toMatchObject({ schemaVersion: 2, commit: head, taskSetCommit: head })
	})

	it('reports a task set that is not committed at HEAD', () => {
		const dir = repo()
		const head = sh(dir, 'rev-parse', 'HEAD')
		sh(dir, '-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'next')
		const r = runTask(dir, config, config.tasks[0]!, 1, fakeRunner(), {
			commit: head,
			taskSetCommit: sh(dir, 'rev-parse', 'HEAD'),
		})
		expect(r.error).toMatch(/could not overlay the task set/)
	})
})

describe('compare', () => {
	const now = new Date('2026-09-28T00:00:00Z')
	const record = (model: string, results: RunResult[], runner: 'print' | 'interactive' = 'print') => ({
		schemaVersion: 2 as const,
		createdAt: now.toISOString(),
		commit: 'x',
		taskSetCommit: 'x',
		model,
		harness: 'claude-code',
		runner,
		runsPerTask: 1,
		summary: summarize(results),
		results,
	})

	it('refuses a baseline taken on another model', () => {
		const c = compare(record('haiku', [result({})]), record('sonnet', [result({})]), now)
		expect(c.incomparable).toBe('the baseline ran model "haiku", this run "sonnet"')
		expect(formatOutcome({ record: record('sonnet', [result({})]), resultsPath: 'r', comparison: c })).toMatch(
			/Not compared/,
		)
	})

	it('refuses a baseline another runner took, reading a baseline with no runner as print', () => {
		const { runner: _, ...legacy } = record('sonnet', [result({})])
		const c = compare(legacy, record('sonnet', [result({})], 'interactive'), now)
		expect(c.incomparable).toBe('the baseline ran runner "print", this run "interactive"')
		expect(compare(legacy, record('sonnet', [result({})]), now).incomparable).toBeUndefined()
	})

	it('skips tasks the baseline never ran and handles a zero baseline', () => {
		const c = compare(
			record('sonnet', [result({ wallMs: 0, cacheReadTokens: 1000 })]),
			record('sonnet', [result({ wallMs: 2000, cacheReadTokens: 800 }), result({ task: 'new' })]),
			now,
		)
		expect(c.tasks.map((t) => t.task)).toEqual(['a'])
		expect(c.tasks[0]?.medianCacheReadTokens).toEqual([1000, 800])
		expect(c.stale).toBe(false)
		expect(formatOutcome({ record: record('sonnet', [result({})]), resultsPath: 'r', comparison: c })).toMatch(
			/cache read 1000 → 800 \(-20%\)\n[\s\S]*wall 0s → 2s\n/,
		)
	})
})

describe('readBaseline', () => {
	it('ignores a baseline it cannot read', () => {
		expect(readBaseline(repo({ [BASELINE_FILE]: '{' }))).toBeUndefined()
		expect(readBaseline(repo({ [BASELINE_FILE]: '{}' }))).toBeUndefined()
	})
})
