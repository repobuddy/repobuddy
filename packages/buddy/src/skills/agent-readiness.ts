/*
 * Score how ready a repository is for coding agents, and measure what agents cost working in it.
 *
 *   node scripts/agent-readiness.mjs score [--dir <repo>] [--json]
 *   node scripts/agent-readiness.mjs score --package <path> [--json]
 *   node scripts/agent-readiness.mjs bench [--dir <repo>] [--init | --baseline] [--runs <n>] [--task <id>] [--yes] [--json]
 *
 * `score` reports the gated level (1-5), a score per area, the top three fixes, and the tokens every
 * agent session loads before it starts (instruction files plus installed skill descriptions, estimated
 * at four characters per token). Nothing is built, installed, or run; nothing is written. Checks with
 * status `judge` are ones a script cannot decide; the agent running the skill settles them, and a
 * failed judgment can only lower the level.
 *
 * `bench` runs the task set in `.agents/readiness/bench/tasks.json` with Claude Code, each run in a
 * clean checkout of HEAD, and records tokens, turns, tool calls, wall time, pass rate, and cost per
 * successful task. It spends money, so without `--yes` it only prints the plan and its spend ceiling.
 * `--baseline` stores the summary as the baseline; any other run is compared against it. `--init`
 * writes a task-set template and runs nothing.
 *
 * With --package, it scores the consuming side instead: how cheaply another repo's agent can use the
 * package through what ships (declarations, exports map, README, changelog, llms.txt), with the same
 * gated report shape. Public surface size and a shipped agent skill are reported, not scored.
 *
 * stdout: a human report, or JSON with --json. stderr: errors and per-run progress.
 * Exit 0 on success, 1 when bench cannot run, 2 on bad usage.
 */

import { resolve } from 'node:path'
import { BenchError, bench, formatOutcome, formatPlan, initTasks, loadConfig, plan } from '../agent-readiness/bench.js'
import { collectFacts } from '../agent-readiness/facts.js'
import { collectPackageFacts } from '../agent-readiness/package-facts.js'
import { formatPackageReport, scorePackage } from '../agent-readiness/package-score.js'
import { formatReport, score } from '../agent-readiness/score.js'

const USAGE = `usage: agent-readiness.mjs score [--dir <repo> | --package <path>] [--json]
       agent-readiness.mjs bench [--dir <repo>] [--init | --baseline] [--runs <n>] [--task <id>] [--yes] [--json]`

function usage(message: string): never {
	process.stderr.write(`${message}\n${USAGE}\n`)
	process.exit(2)
}

interface Opts {
	command: 'score' | 'bench'
	dir: string
	package: string | undefined
	json: boolean
	init: boolean
	baseline: boolean
	yes: boolean
	runs?: number
	task?: string
}

const BENCH_FLAGS = new Set(['--init', '--baseline', '--yes', '--runs', '--task'])

function parseArgs(argv: string[]): Opts {
	const [command, ...rest] = argv
	if (command !== 'score' && command !== 'bench') {
		usage(command === undefined ? 'missing command' : `unknown command "${command}"`)
	}
	const opts: Opts = {
		command,
		dir: process.cwd(),
		package: undefined,
		json: false,
		init: false,
		baseline: false,
		yes: false,
	}
	let hasDir = false
	const value = (i: number, flag: string) => {
		const v = rest[i + 1]
		if (v === undefined) usage(`${flag} needs a value`)
		return v
	}
	for (let i = 0; i < rest.length; i++) {
		const a = rest[i] as string
		if (command === 'score' && BENCH_FLAGS.has(a)) usage(`${a} is a bench option`)
		if (command === 'bench' && a === '--package') usage('--package is a score option')
		if (a === '--dir') {
			opts.dir = resolve(value(i++, a))
			hasDir = true
		} else if (a === '--package') opts.package = resolve(value(i++, a))
		else if (a === '--json') opts.json = true
		else if (a === '--init') opts.init = true
		else if (a === '--baseline') opts.baseline = true
		else if (a === '--yes') opts.yes = true
		else if (a === '--task') opts.task = value(i++, a)
		else if (a === '--runs') {
			const n = Number(value(i++, a))
			if (!Number.isInteger(n) || n < 1) usage('--runs needs a positive whole number')
			opts.runs = n
		} else usage(`unknown argument "${a}"`)
	}
	if (hasDir && opts.package !== undefined) usage('--dir and --package score different things; pass one')
	if (opts.init && (opts.baseline || opts.yes)) usage('--init runs nothing; drop --baseline and --yes')
	if (opts.baseline && opts.task !== undefined) usage('a baseline covers every task; drop --task')
	return opts
}

function runBench(opts: Opts): void {
	if (opts.init) {
		const path = initTasks(opts.dir)
		process.stdout.write(`Wrote ${path}. Replace the example tasks with this repo's own, then plan a run.\n`)
		return
	}
	const config = loadConfig(opts.dir)
	const planOpts = { ...(opts.runs ? { runs: opts.runs } : {}), ...(opts.task ? { task: opts.task } : {}) }
	if (!opts.yes) {
		const p = plan(opts.dir, config, planOpts)
		process.stdout.write(opts.json ? `${JSON.stringify({ plan: p }, null, 2)}\n` : formatPlan(p))
		return
	}
	const outcome = bench(opts.dir, config, {
		...planOpts,
		baseline: opts.baseline,
		onRun: (r) =>
			process.stderr.write(
				`${r.task} #${r.run}: ${r.error ? `error: ${r.error}` : r.pass ? 'pass' : 'fail'}${r.capped ? ' (capped)' : ''}, $${r.costUsd.toFixed(2)}\n`,
			),
	})
	process.stdout.write(opts.json ? `${JSON.stringify(outcome, null, 2)}\n` : formatOutcome(outcome))
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
	const opts = parseArgs(argv)
	if (opts.command === 'bench') {
		try {
			runBench(opts)
		} catch (e) {
			if (!(e instanceof BenchError)) throw e
			process.stderr.write(`${e.message}\n`)
			process.exit(1)
		}
		return
	}
	if (opts.package !== undefined) {
		const result = scorePackage(collectPackageFacts(opts.package))
		process.stdout.write(opts.json ? `${JSON.stringify(result, null, 2)}\n` : formatPackageReport(result))
		return
	}
	const result = score(collectFacts(opts.dir))
	process.stdout.write(opts.json ? `${JSON.stringify(result, null, 2)}\n` : formatReport(result))
}

// Resolve the entry check against the built bundle's filename, since this module runs as
// `skills/agent-readiness/scripts/agent-readiness.mjs`, not under its source name.
/* istanbul ignore next -- process.argv entrypoint guard, exercised only when the bundle runs as a child process */
if (process.argv[1]?.endsWith('agent-readiness.mjs')) await main()
