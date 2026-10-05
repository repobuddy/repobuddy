/*
 * Score how ready a repository is for coding agents, and measure what agents cost working in it.
 *
 *   node scripts/agent-readiness.mjs score [--dir <repo>] [--json] [--run-knip] [--check [--min-level <1-5>]]
 *   node scripts/agent-readiness.mjs score --package <path> [--json] [--check [--min-level <1-4>]]
 *   node scripts/agent-readiness.mjs bench [--dir <repo>] [--init | --baseline] [--runs <n>] [--task <id>] [--ref <commit>] [--runner print|interactive] [--yes] [--json]
 *   node scripts/agent-readiness.mjs bench compare <before.json> <after.json> [--json]
 *   node scripts/agent-readiness.mjs suggest [--dir <repo>] [--area <id>] [<comparison.json>...] [--json]
 *
 * `score` reports the gated level (1-5), a score per area, the top three fixes, and the tokens every
 * agent session loads before it starts (instruction files plus installed skill descriptions, estimated
 * at four characters per token). Nothing is built or installed, and nothing is written. Checks with
 * status `judge` are ones a script cannot decide; the agent running the skill settles them, and a
 * failed judgment can only lower the level. `--run-knip` opts in to running the repo's knip command
 * (dependencies must be installed) and settles `dead-code` from its result. A repo with
 * buddy-agent-harness installed also has its read-only `doctor` run, for the instructions area.
 *
 * `bench` runs the task set in `.agents/readiness/bench/tasks.json` with Claude Code, each run in a
 * clean checkout of HEAD (or of `--ref <commit>`, with HEAD's task set overlaid), and records tokens, turns, tool calls, wall time, pass rate, and cost per
 * successful task. It spends money, so without `--yes` it only prints the plan and its spend ceiling.
 * `--baseline` stores the summary as the baseline; any other run is compared against it. `--init`
 * writes a task-set template and runs nothing. `--runner interactive` runs each task as an interactive
 * session in a terminal multiplexer pane (tmux, herdr) instead of `claude -p`; it needs
 * CLAUDE_CODE_OAUTH_TOKEN or ANTHROPIC_API_KEY, and its runs are never compared with `-p` ones.
 * The plan's estimated spend is the mean cost per run of the stored results, or the cap without any.
 *
 * `bench compare` compares two stored results files (or a baseline) and runs nothing, so it is free:
 * per task and pooled, the mean and median change, the min-max of each side, and an exact permutation
 * p-value. A bench run compares against its baseline the same way.
 *
 * `suggest` reads ACED bench comparison records of suite `repobuddy.readiness` tagged with an area
 * (`aced-bench compare … --tag area=<id>`), by default every one under
 * `.agents/aced/results/bench/repobuddy.readiness/`, and suggests an area-weight override: a bounded
 * step of 5, clamped to 0-40, only on an effect two records replicate, and "keep the weight"
 * otherwise. It prints the override line and its evidence, and writes nothing.
 *
 * With --package, it scores the consuming side instead: how cheaply another repo's agent can use the
 * package through what ships (declarations, exports map, README, changelog, llms.txt), with the same
 * gated report shape. Public surface size and a shipped agent skill are reported, not scored.
 *
 * `score --check` is CI mode: exit 1 when the level is below --min-level (default 3, the target). Only the
 * gates the script decides count; unsettled `judge` gates are reported as provisional and never fail the
 * run. Repo area weights come from the reference `repobuddy.readiness` (the skill ships the default in
 * `references/`); a repo overrides its `## Weights` section in `.agents/references/repobuddy.readiness.md`.
 *
 * stdout: a human report, or JSON with --json. stderr: errors and per-run progress.
 * Exit 0 on success, 1 when bench cannot run, suggest cannot read a comparison record, or `score --check` finds the level below --min-level,
 * 2 on bad usage or a malformed weights config.
 */

import { existsSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
	BenchError,
	bench,
	formatOutcome,
	formatPlan,
	initTasks,
	loadConfig,
	plan,
	printRunner,
	type RunnerName,
} from '../agent-readiness/bench.js'
import { compareRecords, formatRecordComparison, loadRecord, RecordError } from '../agent-readiness/bench-compare.js'
import { interactiveRunner } from '../agent-readiness/bench-interactive.js'
import { ConfigError, REFERENCE, readConfig } from '../agent-readiness/config.js'
import { collectFacts } from '../agent-readiness/facts.js'
import { collectPackageFacts } from '../agent-readiness/package-facts.js'
import { formatPackageReport, PACKAGE_MAX_LEVEL, scorePackage } from '../agent-readiness/package-score.js'
import {
	AREA_WEIGHTS,
	checkLevel,
	formatCheck,
	formatReport,
	MAX_LEVEL,
	score,
	type WeightedArea,
} from '../agent-readiness/score.js'
import { findComparisons, formatSuggestions, SuggestError, suggest } from '../agent-readiness/suggest.js'

const USAGE = `usage: agent-readiness.mjs score [--dir <repo> | --package <path>] [--json] [--run-knip] [--check [--min-level <n>]]
       agent-readiness.mjs bench [--dir <repo>] [--init | --baseline] [--runs <n>] [--task <id>] [--ref <commit>] [--runner print|interactive] [--yes] [--json]
       agent-readiness.mjs bench compare <before.json> <after.json> [--json]
       agent-readiness.mjs suggest [--dir <repo>] [--area <id>] [<comparison.json>...] [--json]`

function usage(message: string): never {
	process.stderr.write(`${message}\n${USAGE}\n`)
	process.exit(2)
}

interface Opts {
	command: 'score' | 'bench' | 'compare' | 'suggest'
	/** `bench compare`'s two files, before and after; `suggest`'s comparison records. */
	files: string[]
	dir: string
	package: string | undefined
	json: boolean
	init: boolean
	baseline: boolean
	yes: boolean
	runs?: number
	task?: string
	ref?: string
	runner?: RunnerName
	check: boolean
	minLevel?: number
	runKnip: boolean
	/** `suggest --area`. */
	area?: WeightedArea
}

const BENCH_FLAGS = new Set(['--init', '--baseline', '--yes', '--runs', '--task', '--ref', '--runner'])
const CHECK_FLAGS = new Set(['--check', '--min-level'])

/** The documented target level, and what --check holds a repo or package to unless told otherwise. */
const DEFAULT_MIN_LEVEL = 3

function parseCompare(rest: string[]): Opts {
	const files: string[] = []
	let json = false
	for (const a of rest) {
		if (a === '--json') json = true
		else if (a.startsWith('--')) usage(`bench compare takes two files and --json, not ${a}`)
		else files.push(resolve(a))
	}
	if (files.length !== 2) usage('bench compare needs two files: before, then after')
	return {
		command: 'compare',
		files,
		dir: process.cwd(),
		package: undefined,
		json,
		init: false,
		baseline: false,
		yes: false,
		check: false,
		runKnip: false,
	}
}

function parseSuggest(rest: string[]): Opts {
	const opts: Opts = {
		command: 'suggest',
		files: [],
		dir: process.cwd(),
		package: undefined,
		json: false,
		init: false,
		baseline: false,
		yes: false,
		check: false,
		runKnip: false,
	}
	for (let i = 0; i < rest.length; i++) {
		const a = rest[i] as string
		const value = () => {
			const v = rest[++i]
			if (v === undefined) usage(`${a} needs a value`)
			return v
		}
		if (a === '--json') opts.json = true
		else if (a === '--dir') opts.dir = resolve(value())
		else if (a === '--area') {
			const area = value()
			if (!(area in AREA_WEIGHTS)) usage(`--area is one of ${Object.keys(AREA_WEIGHTS).join(', ')}`)
			opts.area = area as WeightedArea
		} else if (a.startsWith('--')) usage(`suggest does not take ${a}`)
		else opts.files.push(resolve(a))
	}
	return opts
}

function parseArgs(argv: string[]): Opts {
	const [command, ...rest] = argv
	if (command === 'suggest') return parseSuggest(rest)
	if (command !== 'score' && command !== 'bench') {
		usage(command === undefined ? 'missing command' : `unknown command "${command}"`)
	}
	if (command === 'bench' && rest[0] === 'compare') return parseCompare(rest.slice(1))
	const opts: Opts = {
		command,
		files: [],
		dir: process.cwd(),
		package: undefined,
		json: false,
		init: false,
		baseline: false,
		yes: false,
		check: false,
		runKnip: false,
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
		if (command === 'bench' && (a === '--package' || a === '--run-knip' || CHECK_FLAGS.has(a))) {
			usage(`${a} is a score option`)
		}
		if (a === '--dir') {
			opts.dir = resolve(value(i++, a))
			hasDir = true
		} else if (a === '--package') opts.package = resolve(value(i++, a))
		else if (a === '--json') opts.json = true
		else if (a === '--init') opts.init = true
		else if (a === '--baseline') opts.baseline = true
		else if (a === '--yes') opts.yes = true
		else if (a === '--task') opts.task = value(i++, a)
		else if (a === '--ref') opts.ref = value(i++, a)
		else if (a === '--runner') {
			const v = value(i++, a)
			if (v !== 'print' && v !== 'interactive') usage('--runner is print or interactive')
			opts.runner = v
		} else if (a === '--check') opts.check = true
		else if (a === '--run-knip') opts.runKnip = true
		else if (a === '--min-level') {
			const v = value(i++, a)
			if (!/^[1-9]\d*$/.test(v)) usage('--min-level needs a whole number from 1')
			opts.minLevel = Number(v)
		} else if (a === '--runs') {
			const n = Number(value(i++, a))
			if (!Number.isInteger(n) || n < 1) usage('--runs needs a positive whole number')
			opts.runs = n
		} else usage(`unknown argument "${a}"`)
	}
	if (hasDir && opts.package !== undefined) usage('--dir and --package score different things; pass one')
	if (opts.runKnip && opts.package !== undefined) usage('--run-knip checks a repo; --package reads only what ships')
	if (opts.minLevel !== undefined) {
		if (!opts.check) usage('--min-level needs --check')
		// A repo can reach level 5 (a fresh bench baseline); a package tops out at 4.
		const max = opts.package === undefined ? MAX_LEVEL : PACKAGE_MAX_LEVEL
		if (opts.minLevel > max) {
			usage(`--min-level for ${opts.package === undefined ? 'a repo' : '--package'} is 1 to ${max}`)
		}
	}
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
	// Built before the plan, so a missing multiplexer or credential shows before anyone says yes.
	const runner = opts.runner === 'interactive' ? interactiveRunner() : printRunner
	const planOpts = {
		...(opts.runs ? { runs: opts.runs } : {}),
		...(opts.task ? { task: opts.task } : {}),
		...(opts.ref ? { ref: opts.ref } : {}),
		runner,
	}
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

function report<R extends { level: number; pendingJudgments: Array<{ id: string; level: number }> }>(
	opts: Opts,
	result: R,
	format: (result: R) => string,
): void {
	if (!opts.check) {
		process.stdout.write(opts.json ? `${JSON.stringify(result, null, 2)}\n` : format(result))
		return
	}
	const check = checkLevel(result, opts.minLevel ?? DEFAULT_MIN_LEVEL)
	process.stdout.write(
		opts.json
			? `${JSON.stringify({ ...result, check }, null, 2)}\n`
			: `${format(result)}\n${formatCheck(result.level, check)}`,
	)
	if (!check.passed) process.exit(1)
}

function runCompare(opts: Opts): void {
	const [before, after] = opts.files as [string, string]
	let comparison: ReturnType<typeof compareRecords>
	try {
		comparison = compareRecords(loadRecord(before), loadRecord(after))
	} catch (e) {
		if (!(e instanceof RecordError)) throw e
		process.stderr.write(`${e.message}\n`)
		process.exit(1)
	}
	process.stdout.write(
		opts.json
			? `${JSON.stringify({ before, after, comparison }, null, 2)}\n`
			: formatRecordComparison(comparison, relative(process.cwd(), before), relative(process.cwd(), after)),
	)
}

/**
 * The skill folder, whose `references/` holds the default reference: beside the bundled script
 * (`skills/agent-readiness/scripts/`), or from the package's `esm/` or `src/skills/`.
 */
function skillDir(): string | undefined {
	const here = dirname(fileURLToPath(import.meta.url))
	return [join(here, '..'), join(here, '../skills/agent-readiness'), join(here, '../../skills/agent-readiness')].find(
		(dir) => existsSync(join(dir, 'references', `${REFERENCE}.md`)),
	)
}

async function runSuggest(opts: Opts): Promise<void> {
	try {
		const config = await readConfig(opts.dir, { skillDir: skillDir() })
		for (const warning of config.warnings) process.stderr.write(`${warning}\n`)
		const weights = { ...AREA_WEIGHTS, ...config.weights }
		const files = opts.files.length > 0 ? opts.files : findComparisons(opts.dir)
		const result = suggest(files, weights, opts.area)
		process.stdout.write(opts.json ? `${JSON.stringify(result, null, 2)}\n` : formatSuggestions(result))
	} catch (e) {
		if (!(e instanceof SuggestError || e instanceof ConfigError)) throw e
		process.stderr.write(`${e.message}\n`)
		process.exit(e instanceof ConfigError ? 2 : 1)
	}
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
	const opts = parseArgs(argv)
	if (opts.command === 'suggest') {
		await runSuggest(opts)
		return
	}
	if (opts.command === 'compare') {
		runCompare(opts)
		return
	}
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
		report(opts, scorePackage(collectPackageFacts(opts.package)), formatPackageReport)
		return
	}
	let config: Awaited<ReturnType<typeof readConfig>>
	try {
		config = await readConfig(opts.dir, { skillDir: skillDir() })
	} catch (e) {
		if (!(e instanceof ConfigError)) throw e
		process.stderr.write(`${e.message}\n`)
		process.exit(2)
	}
	for (const warning of config.warnings) process.stderr.write(`${warning}\n`)
	report(opts, score(collectFacts(opts.dir, { runKnip: opts.runKnip }), { weights: config.weights }), formatReport)
}

// Resolve the entry check against the built bundle's filename, since this module runs as
// `skills/agent-readiness/scripts/agent-readiness.mjs`, not under its source name.
/* istanbul ignore next -- process.argv entrypoint guard, exercised only when the bundle runs as a child process */
if (process.argv[1]?.endsWith('agent-readiness.mjs')) await main()
