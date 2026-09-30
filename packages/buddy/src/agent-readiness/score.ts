/**
 * Grades collected facts into a gated level, a score per area, and a ranked fix list.
 *
 * Gates decide the level: a repo is at level N when every gate at levels 1..N passes, so strong docs
 * cannot hide a missing verify command. Weights only order the fixes and the area scores. Security
 * findings never subtract points; they cap the level.
 */

import { BASELINE_FILE, BASELINE_MAX_AGE_DAYS, baselineAgeDays } from './bench.js'
import type { Facts } from './facts.js'
import type { CommentFacts } from './source.js'

type Area =
	| 'verification'
	| 'instructions'
	| 'navigability'
	| 'noise'
	| 'self-describing'
	| 'environment'
	| 'task-discovery'
	| 'security'

/** Areas that carry a weight. Security has none: its findings cap the level instead. */
export type WeightedArea = Exclude<Area, 'security'>

export type Weights = Record<WeightedArea, number>

/**
 * Starting weights. They are hypotheses until behavioral measurement revises them, and the report prints them.
 * A repo can override them (see `config.ts`); weights never touch gates or the level.
 */
export const AREA_WEIGHTS: Weights = {
	verification: 25,
	instructions: 15,
	navigability: 15,
	noise: 15,
	'self-describing': 10,
	environment: 10,
	'task-discovery': 5,
}

const LEVELS: Record<number, string> = {
	0: 'An agent cannot orient itself',
	1: 'An agent can read it',
	2: 'An agent can check its own work',
	3: 'An agent can work without supervision',
	4: 'An agent works cheaply',
	5: 'The cost is measured',
}

/** Level 5 is the only behavioral gate: it needs a `bench` baseline, which `score` reads but never runs. */
export const MAX_LEVEL = 5

/**
 * `pass` and `fail` are decided by the script. `judge` means the script cannot decide it: the agent
 * running the skill reads the evidence and settles it, and a failed judgment can only lower the level.
 */
type Status = 'pass' | 'fail' | 'judge' | 'n/a'

export interface Check<A extends string = Area> {
	id: string
	area: A
	level: number
	gate: boolean
	/** 1 is minutes, 2 is an hour or so, 3 is a project. */
	effort: 1 | 2 | 3
	status: Status
	summary: string
	detail?: string[]
	fix?: string
	/** The skill that owns the fix, when it is not this one. */
	handoff?: string
}

export interface AreaScore<A extends string = Exclude<Area, 'security'>> {
	area: A
	weight: number
	passed: number
	total: number
	/** Passed share of decided checks, 0-100; `undefined` when nothing in the area was decidable. */
	score: number | undefined
}

export interface ScoreResult {
	level: number
	levelName: string
	/** The level the gates alone would give, before a security cap. */
	gatedLevel: number
	securityCap: number | undefined
	checks: Check[]
	areas: AreaScore[]
	topFixes: Check[]
	/** Pending `judge` gates at or below the awarded level; each one, if it fails, lowers the level. */
	pendingJudgments: Check[]
	tokensPerSession: { instructions: number; skills: number; total: number }
	weights: Weights
	/** Areas whose weight came from the repo's override instead of the defaults. */
	overriddenWeights: WeightedArea[]
}

export interface ScoreOptions {
	/** Per-repo weight overrides, merged over `AREA_WEIGHTS`. */
	weights?: Partial<Weights> | undefined
	/** The clock the bench-baseline freshness gate reads; tests pin it. */
	now?: Date | undefined
}

/** Instruction files load on every turn; past this many tokens, each line should be earning its place. */
export const INSTRUCTION_TOKEN_BUDGET = 3000

export function list(items: string[], limit = 10): string[] {
	return items.length > limit ? [...items.slice(0, limit), `… and ${items.length - limit} more`] : items
}

const VERIFY_SCRIPTS = ['verify', 'check', 'validate', 'ci', 'precommit', 'pre-commit']

/** Comment lines as a share of non-blank source lines. At or under this, comments cost too little to judge. */
export const COMMENT_SHARE_BUDGET = 0.15

function commentShare(comments: CommentFacts): number {
	const total = comments.codeLines + comments.commentLines
	return total === 0 ? 0 : comments.commentLines / total
}

function commentDetail(comments: CommentFacts): string[] {
	const total = comments.codeLines + comments.commentLines
	return [
		`${Math.round(commentShare(comments) * 100)}% comments: ${comments.commentLines} of ${total} non-test source lines in ${comments.files} files`,
		...comments.heaviest.map((f) => `${f.path}: ${f.commentLines} comment, ${f.codeLines} code lines`),
	]
}

/** Settled when `--run-knip` ran knip; otherwise a judgment that names the command to run. */
function deadCode(facts: Facts): Pick<Check, 'status' | 'detail'> {
	const run = facts.deadCodeRun
	if (run?.outcome === 'clean') return { status: 'pass', detail: [`ran: ${run.command}`] }
	if (run?.outcome === 'found') return { status: 'fail', detail: [`ran: ${run.command}`, ...run.groups] }
	if (!facts.deadCodeCommand) return { status: 'n/a' }
	return {
		status: 'judge',
		detail: [
			`run: ${facts.deadCodeCommand}`,
			...(run?.error ? [`--run-knip could not complete it: ${run.error}`] : []),
		],
	}
}

export function buildChecks(facts: Facts, now: Date = new Date()): Check[] {
	const { comments } = facts
	const verifyScript = VERIFY_SCRIPTS.find((s) => facts.scripts.includes(s))
	const instructionTokens = facts.instructionFiles.reduce((sum, f) => sum + f.tokens, 0)
	const hasInstructions = facts.instructionFiles.length > 0
	const baselineAge =
		facts.benchBaselineAt === undefined ? undefined : baselineAgeDays({ createdAt: facts.benchBaselineAt }, now)

	return [
		// Level 1: an agent can read it.
		{
			id: 'readme',
			area: 'instructions',
			level: 1,
			gate: true,
			effort: 1,
			status: facts.hasReadme ? 'pass' : 'fail',
			summary: 'A README says what the project is',
			fix: 'Add a README that says what the project is, in its first paragraph.',
		},
		{
			id: 'manifest',
			area: 'environment',
			level: 1,
			gate: true,
			effort: 2,
			status: facts.hasManifest ? 'pass' : 'fail',
			summary: 'A build manifest names how the project builds',
			fix: 'Add the manifest the toolchain expects (package.json, pyproject.toml, Cargo.toml, go.mod, Makefile).',
		},
		// Level 2: an agent can check its own work.
		{
			id: 'verify-command',
			area: 'verification',
			level: 2,
			gate: true,
			effort: 2,
			status: verifyScript ? 'pass' : 'fail',
			summary: 'One command gates everything (verify, check, validate, or ci)',
			...(verifyScript ? { detail: [`found: ${verifyScript}`] } : {}),
			fix: 'Add one script that runs typecheck, lint, and tests together, and name it in the instructions file.',
		},
		{
			id: 'test-command',
			area: 'verification',
			level: 2,
			gate: true,
			effort: 2,
			status: facts.scripts.includes('test') ? 'pass' : 'fail',
			summary: 'A test command exists',
			fix: 'Add a `test` script.',
		},
		{
			id: 'ci-config',
			area: 'verification',
			level: 2,
			gate: false,
			effort: 2,
			status: facts.ciConfigs.length > 0 ? 'pass' : 'fail',
			summary: 'CI runs on every change',
			...(facts.ciConfigs.length > 0 ? { detail: facts.ciConfigs } : {}),
			fix: 'Add a CI workflow that runs the verify command.',
			handoff: 'setup-github-repo',
		},
		{
			id: 'ci-runs-verify',
			area: 'verification',
			level: 2,
			gate: true,
			effort: 1,
			status: verifyScript && facts.ciConfigs.length > 0 ? 'judge' : 'n/a',
			summary: 'CI runs the same verify command an agent runs locally, with no interactive step',
			...(verifyScript ? { detail: [`compare \`${verifyScript}\` with: ${facts.ciConfigs.join(', ')}`] } : {}),
			fix: 'Make CI call the same verify command, so a local pass predicts a CI pass.',
		},
		// Level 3: an agent can work without supervision.
		{
			id: 'instructions-file',
			area: 'instructions',
			level: 3,
			gate: true,
			effort: 2,
			status: hasInstructions ? 'pass' : 'fail',
			summary: 'An agent instructions file exists (AGENTS.md)',
			...(hasInstructions ? { detail: facts.instructionFiles.map((f) => f.path) } : {}),
			fix: 'Add an AGENTS.md with the commands, layout, and conventions an agent needs.',
			handoff: 'buddy-agent-harness',
		},
		{
			id: 'instructions-commands',
			area: 'instructions',
			level: 3,
			gate: true,
			effort: 1,
			status: !hasInstructions ? 'n/a' : facts.missingInstructionCommands.length === 0 ? 'pass' : 'fail',
			summary: 'Every script the instructions file names exists',
			...(facts.missingInstructionCommands.length > 0 ? { detail: list(facts.missingInstructionCommands) } : {}),
			fix: 'Fix or remove each command the instructions name but the repo does not define.',
		},
		{
			id: 'instructions-accurate',
			area: 'instructions',
			level: 3,
			gate: true,
			effort: 2,
			status: hasInstructions ? 'judge' : 'n/a',
			summary: 'The instructions file matches the repo, and every line earns its place',
			fix: 'Cut history, restated code, and stale sections; keep commands, layout, and rules an agent cannot infer.',
			handoff: 'buddy-agent-harness',
		},
		{
			id: 'toolchain-pinned',
			area: 'environment',
			level: 3,
			gate: true,
			effort: 1,
			status: facts.toolchainPins.length > 0 ? 'pass' : 'fail',
			summary: 'The toolchain version is pinned',
			...(facts.toolchainPins.length > 0 ? { detail: facts.toolchainPins } : {}),
			fix: 'Pin the toolchain: `packageManager` in package.json, `.nvmrc`, `mise.toml`, or the language equivalent.',
		},
		{
			id: 'lockfile',
			area: 'environment',
			level: 3,
			gate: false,
			effort: 1,
			status: facts.hasLockfile ? 'pass' : 'fail',
			summary: 'A lockfile is committed',
			fix: 'Commit the lockfile so every install resolves the same versions.',
		},
		{
			id: 'setup-documented',
			area: 'environment',
			level: 3,
			gate: true,
			effort: 2,
			status: 'judge',
			summary: 'Setup is documented and runs in one non-interactive step',
			fix: 'Document one setup command (install, then build if tests need it) that never prompts.',
		},
		{
			id: 'env-documented',
			area: 'environment',
			level: 3,
			gate: false,
			effort: 1,
			status: !facts.undocumentedEnv ? 'n/a' : facts.undocumentedEnv.length === 0 ? 'pass' : 'fail',
			summary: 'Every environment variable the source reads is documented',
			...(facts.undocumentedEnv && facts.undocumentedEnv.length > 0
				? { detail: list(facts.undocumentedEnv.map((e) => `${e.name}: read in ${e.readIn}`)) }
				: {}),
			fix: 'Name each variable, what it is for, and whether it is required in `.env.example` or the setup docs.',
		},
		{
			id: 'fast-feedback',
			area: 'verification',
			level: 3,
			gate: false,
			effort: 2,
			status: facts.preCommitHooks.length > 0 ? 'pass' : 'fail',
			summary: 'Fast feedback runs before CI (a pre-commit hook or a quick subset)',
			...(facts.preCommitHooks.length > 0 ? { detail: facts.preCommitHooks } : {}),
			fix: 'Add a pre-commit hook that runs format and lint on staged files.',
		},
		{
			id: 'contributing',
			area: 'task-discovery',
			level: 3,
			gate: false,
			effort: 1,
			status: facts.hasContributing ? 'pass' : 'fail',
			summary: 'A CONTRIBUTING file says how work is done here',
			fix: 'Add a CONTRIBUTING.md with the definition of done.',
		},
		{
			id: 'issue-templates',
			area: 'task-discovery',
			level: 3,
			gate: false,
			effort: 1,
			status: facts.hasIssueTemplates ? 'pass' : 'fail',
			summary: 'Issue templates shape incoming tasks',
			fix: 'Add issue templates that ask for reproduction steps and acceptance criteria.',
		},
		{
			id: 'ts-strict',
			area: 'self-describing',
			level: 3,
			gate: false,
			effort: 3,
			status: facts.tsStrict === undefined ? 'n/a' : facts.tsStrict ? 'pass' : 'fail',
			summary: 'TypeScript runs in strict mode',
			fix: 'Turn on `strict` so the types carry the constraints prose would otherwise explain.',
		},
		// Level 4: an agent works cheaply.
		{
			id: 'instructions-lean',
			area: 'instructions',
			level: 4,
			gate: true,
			effort: 2,
			status: !hasInstructions ? 'n/a' : instructionTokens <= INSTRUCTION_TOKEN_BUDGET ? 'pass' : 'fail',
			summary: `Instruction files load under ${INSTRUCTION_TOKEN_BUDGET} tokens per turn`,
			detail: facts.instructionFiles.map((f) => `${f.path}: ~${f.tokens} tokens`),
			fix: 'Move reference material out of the instructions file into files an agent reads on demand.',
			handoff: 'buddy-agent-harness',
		},
		{
			id: 'large-files',
			area: 'navigability',
			level: 4,
			gate: true,
			effort: 3,
			status: facts.largeFiles.length === 0 ? 'pass' : 'fail',
			summary: 'No hand-written file runs past 1000 lines (agents often read whole files)',
			...(facts.largeFiles.length > 0
				? { detail: list(facts.largeFiles.map((f) => `${f.path}: ${Number.isFinite(f.lines) ? f.lines : '>4MB'}`)) }
				: {}),
			fix: 'Split the largest files along their seams.',
		},
		{
			id: 'build-output-untracked',
			area: 'noise',
			level: 4,
			gate: true,
			effort: 1,
			status: facts.trackedBuildOutput.length === 0 ? 'pass' : 'fail',
			summary: 'Build output, coverage, and minified files are not committed (they flood search)',
			...(facts.trackedBuildOutput.length > 0 ? { detail: list(facts.trackedBuildOutput) } : {}),
			fix: 'Untrack them and add the folders to `.gitignore`; if they must stay, add them to `.ignore` so search skips them.',
		},
		{
			id: 'monorepo-map',
			area: 'navigability',
			level: 4,
			gate: false,
			effort: 1,
			status: facts.isMonorepo ? 'judge' : 'n/a',
			summary: 'A monorepo map says which package owns what',
			fix: 'Add a package map to the instructions file: one line per package, what it owns.',
		},
		{
			id: 'comment-signal',
			area: 'noise',
			level: 4,
			gate: false,
			effort: 2,
			status: !comments ? 'n/a' : commentShare(comments) <= COMMENT_SHARE_BUDGET ? 'pass' : 'judge',
			summary: `Comments state constraints, not history, restated names, or essays (judged above ${Math.round(COMMENT_SHARE_BUDGET * 100)}% of source)`,
			...(comments ? { detail: commentDetail(comments) } : {}),
			fix: 'Cut comments that narrate history or restate the code; keep the ones that state a constraint.',
		},
		{
			id: 'orphaned-jsdoc',
			area: 'noise',
			level: 4,
			gate: false,
			effort: 1,
			status: !comments ? 'n/a' : comments.orphanedJsdoc.length === 0 ? 'pass' : 'fail',
			summary: 'No JSDoc block is left documenting nothing',
			...(comments && comments.orphanedJsdoc.length > 0 ? { detail: list(comments.orphanedJsdoc) } : {}),
			fix: 'Delete each orphaned block, or move it onto the declaration it was written for.',
		},
		{
			id: 'generic-names',
			area: 'navigability',
			level: 4,
			gate: false,
			effort: 2,
			status: !facts.nameCollisions ? 'n/a' : facts.nameCollisions.length === 0 ? 'pass' : 'judge',
			summary: 'Top-level names are specific enough that a grep for one finds it, not a flood',
			...(facts.nameCollisions && facts.nameCollisions.length > 0
				? {
						detail: list(
							facts.nameCollisions.map(
								(n) => `${n.name}: declared in ${n.declaredIn} file(s), grep matches ${n.matchingFiles} files`,
							),
						),
					}
				: {}),
			fix: 'Rename the worst offenders to say what they do (`runMigrations`, not `run`); split `utils` by what each part is for.',
		},
		{
			id: 'dead-code',
			area: 'noise',
			level: 4,
			gate: false,
			effort: 2,
			...deadCode(facts),
			summary: 'No unused files, exports, or dependencies (reported by knip)',
			fix: 'Delete what knip reports as unused, or tell knip why it is used.',
		},
		// Level 5: the cost is measured.
		{
			id: 'bench-baseline',
			area: 'verification',
			level: 5,
			gate: true,
			effort: 3,
			status: baselineAge !== undefined && baselineAge <= BASELINE_MAX_AGE_DAYS ? 'pass' : 'fail',
			summary: `A \`bench\` baseline exists and is at most ${BASELINE_MAX_AGE_DAYS} days old`,
			detail: [baselineAge === undefined ? `no ${BASELINE_FILE}` : `${BASELINE_FILE}: ${baselineAge} days old`],
			fix: 'Write a 3-5 task set and record a baseline with `agent-readiness bench --baseline`; refresh it as the repo changes.',
		},
		// Security: these cap the level instead of subtracting points.
		{
			id: 'committed-secrets',
			area: 'security',
			level: 1,
			gate: true,
			effort: 2,
			status: facts.committedSecretFiles.length === 0 ? 'pass' : 'fail',
			summary: 'No secret-bearing file is committed (.env, keys, credentials)',
			...(facts.committedSecretFiles.length > 0 ? { detail: list(facts.committedSecretFiles) } : {}),
			fix: 'Rotate the secret first, then untrack the file and ignore it. Removing it from history does not un-leak it.',
		},
		{
			id: 'mcp-literal-credentials',
			area: 'security',
			level: 1,
			gate: true,
			effort: 1,
			status: facts.mcpLiteralCredentials.length === 0 ? 'pass' : 'fail',
			summary: 'MCP configuration holds no literal credentials',
			...(facts.mcpLiteralCredentials.length > 0 ? { detail: facts.mcpLiteralCredentials } : {}),
			// biome-ignore lint/suspicious/noTemplateCurlyInString: the literal `${VAR}` is the syntax the fix asks for
			fix: 'Rotate the credential, then reference it from the environment (`${VAR}`).',
			handoff: 'buddy-agent-harness',
		},
		{
			id: 'env-ignored',
			area: 'security',
			level: 2,
			gate: true,
			effort: 1,
			status: facts.envIgnored === undefined ? 'n/a' : facts.envIgnored ? 'pass' : 'fail',
			summary: '`.env` is ignored by git',
			fix: 'Add `.env` and `.env.*` (with `!.env.example`) to `.gitignore`.',
		},
	]
}

/** Security failures cap the level: a committed credential at 1, an unignored `.env` at 2. */
function securityCap(checks: Check<string>[]): number | undefined {
	const failed = checks.filter((c) => c.area === 'security' && c.status === 'fail')
	if (failed.length === 0) return undefined
	return Math.min(...failed.map((c) => c.level))
}

export function gatedLevel(checks: Check<string>[], maxLevel: number): number {
	let level = 0
	for (let n = 1; n <= maxLevel; n++) {
		const blocked = checks.some((c) => c.area !== 'security' && c.gate && c.level === n && c.status === 'fail')
		if (blocked) break
		level = n
	}
	return level
}

export function areaScores<A extends string>(checks: Check<string>[], weights: Record<A, number>): AreaScore<A>[] {
	return (Object.keys(weights) as A[]).map((area) => {
		const decided = checks.filter((c) => c.area === area && (c.status === 'pass' || c.status === 'fail'))
		const passed = decided.filter((c) => c.status === 'pass').length
		return {
			area,
			weight: weights[area],
			passed,
			total: decided.length,
			score: decided.length === 0 ? undefined : Math.round((passed / decided.length) * 100),
		}
	})
}

/**
 * Security failures come first, then gates that block the next level, then everything else by area
 * weight per unit of effort.
 */
export function rankFixes<C extends Check<string>>(checks: C[], level: number, weights: Record<string, number>): C[] {
	const rank = (c: C) => {
		const weight = weights[c.area] ?? 0
		if (c.area === 'security') return [0, c.level, 0]
		if (c.gate && c.level === level + 1) return [1, 0, -weight / c.effort]
		if (c.gate) return [2, c.level, -weight / c.effort]
		return [3, 0, -weight / c.effort]
	}
	return checks
		.filter((c) => c.status === 'fail')
		.sort((a, b) => {
			const [ra, rb] = [rank(a), rank(b)]
			for (let i = 0; i < ra.length; i++) {
				const d = (ra[i] as number) - (rb[i] as number)
				if (d !== 0) return d
			}
			return 0
		})
}

export function score(facts: Facts, options: ScoreOptions = {}): ScoreResult {
	const weights: Weights = { ...AREA_WEIGHTS, ...options.weights }
	const checks = buildChecks(facts, options.now ?? new Date())
	const gated = gatedLevel(checks, MAX_LEVEL)
	const cap = securityCap(checks)
	const level = cap === undefined ? gated : Math.min(gated, cap)
	const instructions = facts.instructionFiles.reduce((sum, f) => sum + f.tokens, 0)
	const skills = facts.skillDescriptions.reduce((sum, s) => sum + s.tokens, 0)
	return {
		level,
		levelName: LEVELS[level] as string,
		gatedLevel: gated,
		securityCap: cap,
		checks,
		areas: areaScores(checks, weights),
		topFixes: rankFixes(checks, level, weights).slice(0, 3),
		pendingJudgments: checks.filter((c) => c.status === 'judge' && c.gate && c.level <= level),
		tokensPerSession: { instructions, skills, total: instructions + skills },
		weights,
		overriddenWeights: (Object.keys(options.weights ?? {}) as WeightedArea[]).filter(
			(area) => options.weights?.[area] !== AREA_WEIGHTS[area],
		),
	}
}

export interface LevelCheck {
	minLevel: number
	passed: boolean
	/**
	 * Unsettled `judge` gates at or below `minLevel` when the check passes. CI cannot settle them, so they
	 * never change the exit code; a failed one would lower the level.
	 */
	provisional: string[]
}

/** CI mode: holds a repo or package at `minLevel` using only the gates the script decides. */
export function checkLevel(
	result: { level: number; pendingJudgments: Array<Pick<Check<string>, 'id' | 'level'>> },
	minLevel: number,
): LevelCheck {
	const passed = result.level >= minLevel
	return {
		minLevel,
		passed,
		provisional: passed ? result.pendingJudgments.filter((c) => c.level <= minLevel).map((c) => c.id) : [],
	}
}

export function formatCheck(level: number, check: LevelCheck): string {
	if (!check.passed) return `check: FAIL, level ${level} is below --min-level ${check.minLevel}\n`
	const line = `check: ok, level ${level} meets --min-level ${check.minLevel}`
	return check.provisional.length === 0
		? `${line}\n`
		: `${line} (provisional: unsettled judgment gates ${check.provisional.join(', ')})\n`
}

export function formatReport(result: ScoreResult): string {
	const lines: string[] = []
	lines.push(`Level ${result.level} of ${MAX_LEVEL}: ${result.levelName}`)
	if (result.securityCap !== undefined) {
		lines.push(`  (gates reach level ${result.gatedLevel}; a security finding caps it at ${result.securityCap})`)
	}
	if (result.pendingJudgments.length > 0) {
		lines.push(
			`  provisional: ${result.pendingJudgments.length} gate(s) marked JUDGE need a decision, and a fail lowers it`,
		)
	}
	lines.push('')
	lines.push('Fix first:')
	if (result.topFixes.length === 0) lines.push('  nothing the script can see')
	result.topFixes.forEach((c, i) => {
		lines.push(`  ${i + 1}. [${c.area}] ${c.summary}`)
		if (c.fix) lines.push(`     ${c.fix}${c.handoff ? ` (owner: ${c.handoff})` : ''}`)
	})
	lines.push('')
	const t = result.tokensPerSession
	lines.push(
		`Tokens loaded per session: ~${t.total} (instructions ~${t.instructions}, skill descriptions ~${t.skills})`,
	)
	lines.push('')
	lines.push('Areas (weight: score):')
	for (const a of result.areas) {
		const s = a.score === undefined ? 'n/a' : `${a.score}% (${a.passed}/${a.total})`
		const mark = result.overriddenWeights.includes(a.area) ? ' (repo override)' : ''
		lines.push(`  ${a.area.padEnd(16)} ${String(a.weight).padStart(2)}: ${s}${mark}`)
	}
	lines.push('')
	lines.push('Checks:')
	for (const c of result.checks) {
		const mark = { pass: 'ok  ', fail: 'FAIL', judge: 'JUDGE', 'n/a': 'n/a ' }[c.status]
		lines.push(`  ${mark.padEnd(5)} L${c.level}${c.gate ? '*' : ' '} ${c.id}: ${c.summary}`)
		for (const d of c.detail ?? []) lines.push(`             ${d}`)
	}
	lines.push('')
	lines.push('* gate. Weights are starting estimates, not measured values.')
	return `${lines.join('\n')}\n`
}
