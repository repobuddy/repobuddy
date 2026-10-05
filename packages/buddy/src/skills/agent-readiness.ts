/*
 * Score how ready a repository is for coding agents.
 *
 *   node scripts/agent-readiness.mjs score [--dir <repo>] [--json] [--run-knip] [--check [--min-level <1-5>]]
 *   node scripts/agent-readiness.mjs score --package <path> [--json] [--check [--min-level <1-4>]]
 *   node scripts/agent-readiness.mjs bench convert <results.json> --arm <label> [--suite <s>] [--task-set <dir>] [--out <file>]
 *   node scripts/agent-readiness.mjs suggest [--dir <repo>] [--area <id>] [<comparison.json>...] [--json]
 *
 * `score` reports the gated level (1-5), a score per area, the top three fixes, and the tokens every
 * agent session loads before it starts (instruction files plus installed skill descriptions, estimated
 * at four characters per token). Nothing is built or installed, and nothing is written. Checks with
 * status `judge` are ones a script cannot decide; the agent running the skill settles them, and a
 * failed judgment can only lower the level. `--run-knip` opts in to running the repo's knip command
 * (dependencies must be installed) and settles `dead-code` from its result. A repo with
 * buddy-agent-harness installed also has its read-only `doctor` run, for the instructions area.
 * Level 5 reads the committed baseline of the ACED bench suite `repobuddy.readiness`.
 *
 * `bench` has moved to ACED's measured layer (`npx -y -p cyber-aced@^0.3.0 aced-bench`, suite
 * `repobuddy.readiness`): it prints where it went and exits 1. `bench convert` turns a results file
 * the old bench wrote (schema version 1 or 2) into an ACED version-3 run record, so `aced-bench
 * compare` can re-read it. `--task-set` is the task set the runs used (default the suite's folder);
 * the record goes to --out, or to stdout.
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
 * stdout: a human report, or JSON with --json. stderr: errors and warnings.
 * Exit 0 on success, 1 for `bench`, a record `bench convert` or `suggest` cannot read, or `score --check` finding
 * the level below --min-level, 2 on bad usage or a malformed weights config.
 */

import { existsSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handover, SUITE, suiteDir } from '../agent-readiness/aced-bench.js'
import { RecordError } from '../agent-readiness/bench-compare.js'
import { convertFile } from '../agent-readiness/bench-convert.js'
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
       agent-readiness.mjs bench convert <results.json> --arm <label> [--suite <s>] [--task-set <dir>] [--out <file>]
       agent-readiness.mjs suggest [--dir <repo>] [--area <id>] [<comparison.json>...] [--json]`

function usage(message: string): never {
	process.stderr.write(`${message}\n${USAGE}\n`)
	process.exit(2)
}

interface ScoreOpts {
	command: 'score'
	dir: string
	package: string | undefined
	json: boolean
	check: boolean
	minLevel?: number
	runKnip: boolean
}

interface ConvertOpts {
	command: 'convert'
	file: string
	arm: string
	suite: string
	taskSet: string | undefined
	out: string | undefined
}

interface SuggestOpts {
	command: 'suggest'
	dir: string
	json: boolean
	area?: WeightedArea
	/** Comparison records; none means every stored one. */
	files: string[]
}

type Opts = ScoreOpts | ConvertOpts | SuggestOpts | { command: 'bench'; dir: string }

/** The documented target level, and what --check holds a repo or package to unless told otherwise. */
const DEFAULT_MIN_LEVEL = 3

function parseConvert(rest: string[]): ConvertOpts {
	const files: string[] = []
	const opts: Partial<ConvertOpts> = { suite: SUITE }
	for (let i = 0; i < rest.length; i++) {
		const a = rest[i] as string
		const value = () => {
			const v = rest[++i]
			if (v === undefined) usage(`${a} needs a value`)
			return v
		}
		if (a === '--arm') opts.arm = value()
		else if (a === '--suite') opts.suite = value()
		else if (a === '--task-set') opts.taskSet = resolve(value())
		else if (a === '--out') opts.out = resolve(value())
		else if (a.startsWith('--')) usage(`bench convert does not take ${a}`)
		else files.push(resolve(a))
	}
	if (files.length !== 1) usage('bench convert needs one results file')
	if (opts.arm === undefined) usage('bench convert needs --arm <label>, such as before or after')
	return {
		command: 'convert',
		file: files[0] as string,
		arm: opts.arm,
		suite: opts.suite as string,
		taskSet: opts.taskSet,
		out: opts.out,
	}
}

function parseSuggest(rest: string[]): SuggestOpts {
	const opts: SuggestOpts = { command: 'suggest', files: [], dir: process.cwd(), json: false }
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
	if (command === 'bench') {
		if (rest[0] === 'convert') return parseConvert(rest.slice(1))
		const dir = rest[rest.indexOf('--dir') + 1]
		return { command: 'bench', dir: resolve(rest.includes('--dir') && dir ? dir : process.cwd()) }
	}
	const opts: ScoreOpts = {
		command,
		dir: process.cwd(),
		package: undefined,
		json: false,
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
		if (a === '--dir') {
			opts.dir = resolve(value(i++, a))
			hasDir = true
		} else if (a === '--package') opts.package = resolve(value(i++, a))
		else if (a === '--json') opts.json = true
		else if (a === '--check') opts.check = true
		else if (a === '--run-knip') opts.runKnip = true
		else if (a === '--min-level') {
			const v = value(i++, a)
			if (!/^[1-9]\d*$/.test(v)) usage('--min-level needs a whole number from 1')
			opts.minLevel = Number(v)
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
	return opts
}

function report<R extends { level: number; pendingJudgments: Array<{ id: string; level: number }> }>(
	opts: ScoreOpts,
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

function runConvert(opts: ConvertOpts): void {
	const root = process.cwd()
	let record: ReturnType<typeof convertFile>
	try {
		record = convertFile(opts.file, {
			suite: opts.suite,
			arm: opts.arm,
			taskSet: opts.taskSet ?? join(root, suiteDir(opts.suite)),
			root,
		})
	} catch (e) {
		if (!(e instanceof RecordError)) throw e
		process.stderr.write(`${e.message}\n`)
		process.exit(1)
	}
	const text = `${JSON.stringify(record, null, 2)}\n`
	if (opts.out) writeFileSync(opts.out, text)
	else process.stdout.write(text)
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

async function runSuggest(opts: SuggestOpts): Promise<void> {
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
	if (opts.command === 'bench') {
		process.stderr.write(handover(opts.dir))
		process.exit(1)
	}
	if (opts.command === 'convert') {
		runConvert(opts)
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
