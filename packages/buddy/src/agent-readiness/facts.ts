/**
 * Reads the static facts `score` grades from a repository on disk. Everything here is a file read or
 * a `git` query: nothing is built, installed, or run, so a scan takes seconds and costs no tokens. The
 * one exception is opt-in: `runKnip` runs the repo's knip command (see `knip.ts`).
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'
import { readBaseline } from './bench.js'
import { findUndocumentedEnv, isSetupDoc, type UndocumentedEnv } from './env.js'
import { type DeadCodeRun, runKnip } from './knip.js'
import { type CommentFacts, findNameCollisions, measureComments, type NameCollision } from './source.js'
import { type ReleaseAgeGate, readReleaseAgeGate, readWorkflows, type WorkflowFacts } from './supply-chain.js'

interface InstructionFile {
	path: string
	tokens: number
}

interface SkillDescription {
	path: string
	name: string
	tokens: number
}

interface LargeFile {
	path: string
	lines: number
}

export interface Facts {
	isGitRepo: boolean
	hasReadme: boolean
	hasManifest: boolean
	/** Root `package.json` scripts, or `Makefile` targets, by name. */
	scripts: string[]
	ciConfigs: string[]
	instructionFiles: InstructionFile[]
	skillDescriptions: SkillDescription[]
	/** Package-manager commands named in the instruction files whose script does not exist. */
	missingInstructionCommands: string[]
	toolchainPins: string[]
	hasLockfile: boolean
	preCommitHooks: string[]
	hasContributing: boolean
	hasIssueTemplates: boolean
	isMonorepo: boolean
	/** `undefined` when the repo has no `tsconfig.json`. */
	tsStrict: boolean | undefined
	largeFiles: LargeFile[]
	trackedBuildOutput: string[]
	/** `undefined` outside a git repo, where ignore rules cannot be asked. */
	envIgnored: boolean | undefined
	committedSecretFiles: string[]
	/** `<file>: <key>` for each MCP env entry holding a literal value under a credential-like name. */
	mcpLiteralCredentials: string[]
	/** `undefined` when the repo has no `.github/workflows`. */
	workflows: WorkflowFacts | undefined
	/** `undefined` when the repo has no JavaScript package manager. */
	releaseAgeGate: ReleaseAgeGate | undefined
	/** `undefined` when the repo has no non-test source in a language with `//` comments. */
	comments: CommentFacts | undefined
	/** `undefined` when the repo has no non-test JS or TS source. */
	nameCollisions: NameCollision[] | undefined
	/**
	 * Variables the source reads that no instructions file, README, CONTRIBUTING, or `.env.example`
	 * names; `undefined` when the repo has no non-test JS or TS source.
	 */
	undocumentedEnv: UndocumentedEnv[] | undefined
	/** The command that runs knip, when the repo has it configured; `undefined` otherwise. */
	deadCodeCommand: string | undefined
	/** knip's result, when `score --run-knip` ran it; `undefined` otherwise. */
	deadCodeRun?: DeadCodeRun | undefined
	/** When the stored `bench` baseline was recorded; `undefined` when there is none. */
	benchBaselineAt: string | undefined
}

/** A rough, model-agnostic estimate. Real tokenizers land within about 20% of it for English and code. */
export function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4)
}

const MANIFESTS = ['package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'pom.xml', 'build.gradle', 'Makefile']
const INSTRUCTION_FILES = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md', '.github/copilot-instructions.md', '.cursorrules']
const SKILL_DIRS = ['.agents/skills', '.claude/skills', '.cursor/skills', '.codex/skills', '.github/skills']
const CI_CONFIGS = [
	'.github/workflows',
	'.gitlab-ci.yml',
	'bitbucket-pipelines.yml',
	'azure-pipelines.yml',
	'.forgejo/workflows',
	'.gitea/workflows',
	'.circleci/config.yml',
	'Jenkinsfile',
]
const TOOLCHAIN_FILES = [
	'.nvmrc',
	'.node-version',
	'.tool-versions',
	'mise.toml',
	'.mise.toml',
	'.python-version',
	'rust-toolchain',
	'rust-toolchain.toml',
	'.go-version',
]
const LOCKFILES = [
	'pnpm-lock.yaml',
	'package-lock.json',
	'yarn.lock',
	'bun.lock',
	'bun.lockb',
	'uv.lock',
	'poetry.lock',
	'Cargo.lock',
	'go.sum',
]
const HOOK_CONFIGS = ['.husky', 'lefthook.yml', '.lefthook.yml', '.pre-commit-config.yaml', '.simple-git-hooks.json']
const MCP_FILES = ['.mcp.json', '.cursor/mcp.json', '.vscode/mcp.json']
/** A script that runs knip itself, not one that names a task called `knip` (`turbo run knip`). */
const KNIP_SCRIPT = /^\s*((npx|bunx|pnpm exec|pnpm dlx|yarn)\s+)?knip(\s|$)/
const KNIP_CONFIGS = [
	'knip.json',
	'knip.jsonc',
	'.knip.json',
	'.knip.jsonc',
	'knip.ts',
	'knip.js',
	'knip.mts',
	'knip.config.ts',
	'knip.config.js',
	'knip.config.mjs',
]

const BUILD_OUTPUT = /(^|\/)(dist|build|out|coverage|\.next|\.turbo)\/|\.min\.(js|css)$/
const SECRET_FILE = /(^|\/)(\.env(\.[^/]*)?|id_rsa|id_ed25519|credentials\.json|[^/]*\.(pem|p12|pfx|key))$/
const SECRET_FILE_ALLOWED = /\.(example|sample|template|dist)$/
const CREDENTIAL_KEY = /(token|secret|password|passwd|api[_-]?key|auth)/i
const TEXT_EXTENSIONS =
	/\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|py|rs|go|java|kt|rb|php|cs|swift|c|h|cc|cpp|hpp|vue|svelte|astro|md|mdx|css|scss|sh)$/
const LOCK_OR_GENERATED = /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|CHANGELOG\.md)$/
const LARGE_FILE_LINES = 1000

/** Package-manager built-ins, which an instruction file can name without a matching script. */
const PM_BUILTINS = new Set([
	'install',
	'i',
	'add',
	'remove',
	'rm',
	'update',
	'up',
	'dlx',
	'exec',
	'create',
	'init',
	'publish',
	'pack',
	'link',
	'unlink',
	'outdated',
	'audit',
	'why',
	'list',
	'ls',
	'run',
	'store',
	'patch',
	'patch-commit',
	'approve-builds',
	'config',
	'licenses',
	'rebuild',
	'prune',
	'dedupe',
	'import',
	'fetch',
	'deploy',
	'env',
	'setup',
	'self-update',
	'cache',
	'version',
	'help',
	'test',
	'start',
	'stop',
	'restart',
	'ci',
	'x',
])

function read(dir: string, file: string): string | undefined {
	try {
		return readFileSync(join(dir, file), 'utf8')
	} catch {
		return undefined
	}
}

function exists(dir: string, file: string) {
	return existsSync(join(dir, file))
}

function git(dir: string, args: string[]) {
	return spawnSync('git', args, { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

/** Tracked files in a git repo; outside one, a walk that skips dependency and VCS folders. */
function listFiles(dir: string, isGitRepo: boolean): string[] {
	if (isGitRepo) {
		const r = git(dir, ['ls-files', '-z'])
		if (r.status === 0) return r.stdout.split('\0').filter(Boolean)
	}
	const files: string[] = []
	const walk = (rel: string) => {
		for (const entry of readdirSync(join(dir, rel), { withFileTypes: true })) {
			if (entry.name === 'node_modules' || entry.name === '.git') continue
			const path = rel ? `${rel}/${entry.name}` : entry.name
			if (entry.isDirectory()) walk(path)
			else if (entry.isFile()) files.push(path)
		}
	}
	walk('')
	return files
}

function readScripts(dir: string): string[] {
	const scripts = new Set<string>()
	const pkg = read(dir, 'package.json')
	if (pkg) {
		try {
			for (const name of Object.keys(JSON.parse(pkg).scripts ?? {})) scripts.add(name)
		} catch {
			// An unparsable package.json has no scripts an agent could run either.
		}
	}
	const makefile = read(dir, 'Makefile')
	if (makefile) {
		for (const m of makefile.matchAll(/^([A-Za-z][\w-]*):/gm)) scripts.add(m[1] as string)
	}
	return [...scripts]
}

interface PackageJson {
	scripts?: Record<string, unknown>
	devDependencies?: Record<string, unknown>
	knip?: unknown
	packageManager?: unknown
	engines?: { node?: unknown }
	workspaces?: unknown
	'simple-git-hooks'?: unknown
	'lint-staged'?: unknown
}

function readPackageJson(dir: string): PackageJson {
	try {
		return JSON.parse(read(dir, 'package.json') ?? '{}')
	} catch {
		return {}
	}
}

function frontmatterField(text: string, field: string): string | undefined {
	const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1]
	if (!fm) return undefined
	const m = new RegExp(`^${field}:\\s*(.*)$`, 'm').exec(fm)
	return m?.[1]?.trim().replace(/^["']|["']$/g, '')
}

function readSkillDescriptions(dir: string): SkillDescription[] {
	const seen = new Set<string>()
	const skills: SkillDescription[] = []
	for (const skillDir of SKILL_DIRS) {
		if (!exists(dir, skillDir)) continue
		for (const entry of readdirSync(join(dir, skillDir))) {
			const path = `${skillDir}/${entry}/SKILL.md`
			if (!exists(dir, path)) continue
			// Harness folders often symlink one shared skill; the harness loads each copy, but it is one skill.
			const real = realpathSync(join(dir, path))
			if (seen.has(real)) continue
			seen.add(real)
			const text = read(dir, path) ?? ''
			const name = frontmatterField(text, 'name') ?? entry
			const description = frontmatterField(text, 'description') ?? ''
			skills.push({ path, name, tokens: estimateTokens(`${name}: ${description}`) })
		}
	}
	return skills
}

/** `pnpm <script>`, `npm run <script>`, `yarn <script>`, `bun run <script>`, `make <target>` in an instruction file. */
function findMissingCommands(text: string, scripts: string[]): string[] {
	const known = new Set(scripts)
	const missing = new Set<string>()
	const pattern = /(?:^|[\s`(])(pnpm(?: run)?|npm run|yarn(?: run)?|bun run|make) ([a-z][\w:-]*)/gm
	for (const m of text.matchAll(pattern)) {
		const [, runner, name] = m as unknown as [string, string, string]
		if (runner !== 'make' && !runner.endsWith(' run') && PM_BUILTINS.has(name)) continue
		if (!known.has(name)) missing.add(`${runner} ${name}`)
	}
	return [...missing]
}

function readTsStrict(dir: string): boolean | undefined {
	const text = read(dir, 'tsconfig.json')
	if (text === undefined) return undefined
	// A solution-style tsconfig only lists project references; each referenced project sets its own.
	if (/"references"/.test(text) && !/"compilerOptions"/.test(text)) return undefined
	// A tsconfig that extends a shared preset usually inherits `strict` from it, which cannot be read
	// without resolving the preset. Only a local `"strict": false` counts against it.
	if (/"strict"\s*:\s*false/.test(text)) return false
	return /"strict"\s*:\s*true/.test(text) || /"extends"/.test(text)
}

/** Past this size a file is generated or vendored; it is reported as oversized, never read. */
function isOversized(dir: string, file: string): boolean {
	try {
		return statSync(join(dir, file)).size > 4 * 1024 * 1024
	} catch {
		return false
	}
}

function readMcpLiteralCredentials(dir: string): string[] {
	const found: string[] = []
	for (const file of MCP_FILES) {
		const text = read(dir, file)
		if (!text) continue
		let config: { mcpServers?: Record<string, { env?: Record<string, unknown> }> }
		try {
			config = JSON.parse(text)
		} catch {
			continue
		}
		for (const server of Object.values(config.mcpServers ?? {})) {
			for (const [key, value] of Object.entries(server.env ?? {})) {
				if (!CREDENTIAL_KEY.test(key) || typeof value !== 'string' || value === '') continue
				// `${VAR}` and `$VAR` defer to the environment; anything else is the credential itself.
				if (/^\$\{?[A-Za-z_]\w*\}?$/.test(value)) continue
				found.push(`${file}: ${key}`)
			}
		}
	}
	return found
}

function packageManager(dir: string, pkg: PackageJson): string {
	if (typeof pkg.packageManager === 'string') return pkg.packageManager.split('@')[0] as string
	if (exists(dir, 'pnpm-lock.yaml')) return 'pnpm'
	if (exists(dir, 'yarn.lock')) return 'yarn'
	if (exists(dir, 'bun.lock') || exists(dir, 'bun.lockb')) return 'bun'
	return 'npm'
}

/** Prefers the repo's own knip script, so the run uses its flags. */
function readDeadCodeCommand(dir: string, pkg: PackageJson): string | undefined {
	const script = Object.entries(pkg.scripts ?? {}).find(
		([, command]) => typeof command === 'string' && KNIP_SCRIPT.test(command),
	)?.[0]
	const configured = KNIP_CONFIGS.some((f) => exists(dir, f)) || pkg.knip !== undefined || pkg.devDependencies?.['knip']
	if (!script && !configured) return undefined
	const pm = packageManager(dir, pkg)
	if (!script) return pm === 'npm' ? 'npx knip' : pm === 'bun' ? 'bunx knip' : `${pm} exec knip`
	return pm === 'npm' || pm === 'bun' ? `${pm} run ${script}` : `${pm} ${script}`
}

export interface CollectOptions {
	/** Run the repo's knip command to settle `dead-code`. Needs dependencies installed. */
	runKnip?: boolean | undefined
}

export function collectFacts(dir: string, options: CollectOptions = {}): Facts {
	const isGitRepo = git(dir, ['rev-parse', '--is-inside-work-tree']).stdout.trim() === 'true'
	const files = listFiles(dir, isGitRepo)
	const scripts = readScripts(dir)
	const pkg = readPackageJson(dir)
	const deadCodeCommand = readDeadCodeCommand(dir, pkg)

	const instructionFiles: InstructionFile[] = []
	const missingInstructionCommands = new Set<string>()
	const seenInstructions = new Set<string>()
	for (const file of INSTRUCTION_FILES) {
		const text = read(dir, file)
		if (text === undefined) continue
		// `CLAUDE.md` is often a symlink to `AGENTS.md`: one file, loaded once.
		const real = realpathSync(join(dir, file))
		if (seenInstructions.has(real)) continue
		seenInstructions.add(real)
		instructionFiles.push({ path: file, tokens: estimateTokens(text) })
		for (const command of findMissingCommands(text, scripts)) missingInstructionCommands.add(command)
	}

	const toolchainPins = TOOLCHAIN_FILES.filter((f) => exists(dir, f))
	if (typeof pkg.packageManager === 'string') toolchainPins.unshift('package.json#packageManager')
	if (pkg.engines?.node) toolchainPins.push('package.json#engines.node')

	const preCommitHooks = HOOK_CONFIGS.filter((f) => exists(dir, f))
	if (pkg['simple-git-hooks'] || pkg['lint-staged']) preCommitHooks.push('package.json')

	const searched = files.filter((f) => TEXT_EXTENSIONS.test(f) && !LOCK_OR_GENERATED.test(f) && !BUILD_OUTPUT.test(f))
	const texts = new Map<string, string | undefined>()
	const readText = (file: string) => {
		if (!texts.has(file)) texts.set(file, isOversized(dir, file) ? undefined : read(dir, file))
		return texts.get(file)
	}
	const largeFiles = searched
		.map((path) => ({
			path,
			lines: isOversized(dir, path) ? Number.POSITIVE_INFINITY : (readText(path) ?? '').split('\n').length,
		}))
		.filter((f) => f.lines > LARGE_FILE_LINES)
		.sort((a, b) => b.lines - a.lines)

	let envIgnored: boolean | undefined
	if (isGitRepo) envIgnored = git(dir, ['check-ignore', '-q', '--no-index', '.env']).status === 0

	return {
		isGitRepo,
		hasReadme: files.some((f) => /^readme(\.[a-z]+)?$/i.test(f)),
		hasManifest: MANIFESTS.some((f) => exists(dir, f)),
		scripts,
		ciConfigs: CI_CONFIGS.filter((f) => exists(dir, f)),
		instructionFiles,
		skillDescriptions: readSkillDescriptions(dir),
		missingInstructionCommands: [...missingInstructionCommands],
		toolchainPins,
		hasLockfile: LOCKFILES.some((f) => exists(dir, f)),
		preCommitHooks,
		hasContributing: files.some((f) => /^(\.github\/|docs\/)?contributing(\.[a-z]+)?$/i.test(f)),
		hasIssueTemplates: exists(dir, '.github/ISSUE_TEMPLATE') || exists(dir, '.gitlab/issue_templates'),
		isMonorepo: exists(dir, 'pnpm-workspace.yaml') || Array.isArray(pkg.workspaces) || exists(dir, 'lerna.json'),
		tsStrict: readTsStrict(dir),
		largeFiles,
		trackedBuildOutput: files.filter((f) => BUILD_OUTPUT.test(f)),
		envIgnored,
		committedSecretFiles: files.filter((f) => SECRET_FILE.test(f) && !SECRET_FILE_ALLOWED.test(basename(f))),
		mcpLiteralCredentials: readMcpLiteralCredentials(dir),
		workflows: readWorkflows(dir),
		releaseAgeGate: readReleaseAgeGate(dir),
		comments: measureComments(searched, readText),
		nameCollisions: findNameCollisions(searched, readText),
		undocumentedEnv: findUndocumentedEnv(
			searched,
			[...INSTRUCTION_FILES.filter((f) => exists(dir, f)), ...files.filter(isSetupDoc)],
			readText,
		),
		deadCodeCommand,
		...(options.runKnip && deadCodeCommand ? { deadCodeRun: runKnip(dir, deadCodeCommand) } : {}),
		benchBaselineAt: readBaseline(dir)?.createdAt,
	}
}
