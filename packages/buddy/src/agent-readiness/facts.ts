/**
 * Reads the static facts `score` grades from a repository on disk. Everything here is a file read or
 * a `git` query: nothing is built, installed, or run, so a scan takes seconds and costs no tokens. Two
 * exceptions: `runKnip` opts in to running the repo's knip command (see `knip.ts`), and an installed
 * buddy-agent-harness has its read-only `doctor` run (see `harness-doctor.ts`).
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs'
import { basename, join, posix } from 'node:path'
import { readBaseline } from './bench.js'
import { findUndocumentedEnv, isSetupDoc, type UndocumentedEnv } from './env.js'
import { findSearchedFixtureDirs, type SearchedFixtureDir } from './fixtures.js'
import { findHarnessDoctor, type HarnessDoctorRun, runHarnessDoctor } from './harness-doctor.js'
import { type InjectionSurface, readInjectionSurface } from './injection-surface.js'
import { type DeadCodeRun, runKnip } from './knip.js'
import { type CommentFacts, findNameCollisions, measureComments, type NameCollision } from './source.js'
import { type ReleaseAgeGate, readReleaseAgeGate, readWorkflows, type WorkflowFacts } from './supply-chain.js'
import { readWorkspacePackages } from './workspaces.js'

interface InstructionFile {
	path: string
	tokens: number
}

/** Where the instruction files state what the project is for and what it deliberately is not. */
interface ScopeFacts {
	/** Files an instructions file names that carry the detail: a well-known name, or one with a scope or non-goals heading. */
	linked: string[]
	/** Well-known scope files (`GOALS.md`, `SCOPE.md`, …) at the root or under `docs/` that no instructions file names. */
	unlinked: string[]
	/** `<file>:<line>: <text>` for each scope, purpose, or non-goals heading or line in an instruction file. */
	sections: string[]
	/**
	 * In a monorepo, the same facts for each workspace package that is not `private`; the root's own
	 * then hold only files outside those packages. `undefined` in a single-package repo.
	 */
	packages?: PackageScope[] | undefined
	/** In a monorepo, the `private` workspace packages the check skips: apps, fixtures, the docs site. */
	privatePackages?: string[] | undefined
}

interface PackageScope {
	dir: string
	name: string
	/** Files the package's own `AGENTS.md`/`CLAUDE.md`, or a root instructions file, names inside the package. */
	linked: string[]
	/** Well-known scope files at the package root or its `docs/` that nothing names. */
	unlinked: string[]
	/** Scope lines in the package's own `AGENTS.md`/`CLAUDE.md`. */
	sections: string[]
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
	scope: ScopeFacts
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
	/**
	 * Tracked fixture and vendored folders whose files no ignore file excludes from search; `undefined`
	 * outside a git repo, where ignore rules cannot be asked.
	 */
	searchedFixtureDirs: SearchedFixtureDir[] | undefined
	/** `undefined` outside a git repo, where ignore rules cannot be asked. */
	envIgnored: boolean | undefined
	committedSecretFiles: string[]
	/** `<file>: <key>` for each MCP env entry holding a literal value under a credential-like name. */
	mcpLiteralCredentials: string[]
	/** `undefined` when the repo has no `.github/workflows`. */
	workflows: WorkflowFacts | undefined
	/** `undefined` when the repo has no JavaScript package manager. */
	releaseAgeGate: ReleaseAgeGate | undefined
	/** Session-start and per-prompt hooks, and MCP servers: reported, never scored. */
	injectionSurface: InjectionSurface
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
	/** buddy-agent-harness `doctor`'s result; `undefined` when the repo does not have it installed. */
	harnessDoctor?: HarnessDoctorRun | undefined
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

const SCOPE_HEADING = /^#{1,6}\s+.*\b(scope|purpose|non-?goals?|boundar(y|ies)|is not|isn't|belongs?)\b/i
const SCOPE_LINE = /\b(non-?goals?|out of scope|not in scope)\b/i

/** The names the check knows without a link to follow; `GOALS.md` is the one `improve` proposes. */
const SCOPE_FILE = /^(docs\/)?(goals|non-?goals|scope|vision|purpose)\.md$/i
/** A markdown link, an `@` import, or a bare mention of a local `.md` file. */
const MD_REFERENCE = /(?:^|[\s`(@[])((?:\.{1,2}\/)?[\w./-]*[\w-]\.md)\b/gim

/** The instruction files a workspace package can carry; harnesses load them when the agent works there. */
const PACKAGE_INSTRUCTION_FILES = ['AGENTS.md', 'CLAUDE.md']
const ANY_INSTRUCTION_FILE = /(^|\/)(AGENTS|CLAUDE|GEMINI)\.md$/

/** `path` is a well-known scope file of the package at `base` (`''` for the repo root). */
function isScopeFileOf(path: string, base: string): boolean {
	if (base === '') return SCOPE_FILE.test(path)
	return path.startsWith(`${base}/`) && SCOPE_FILE.test(path.slice(base.length + 1))
}

/** The local files `text`, read from `file`, names. */
function findNamedFiles(file: string, text: string, fileSet: Set<string>): string[] {
	const named: string[] = []
	for (const m of text.matchAll(MD_REFERENCE)) {
		const target = m[1] as string
		// A link resolves from the file that holds it; a bare `GOALS.md` usually means the root.
		for (const path of [posix.join(posix.dirname(file), target), posix.normalize(target)]) {
			if (fileSet.has(path) && !INSTRUCTION_FILES.includes(path) && !ANY_INSTRUCTION_FILE.test(path)) named.push(path)
		}
	}
	return named
}

function findScopeLines(path: string, text: string): string[] {
	return text
		.split('\n')
		.flatMap((line, i) =>
			SCOPE_HEADING.test(line) || SCOPE_LINE.test(line) ? [`${path}:${i + 1}: ${line.trim().slice(0, 80)}`] : [],
		)
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

/**
 * Sorts what the instruction files name into the root's scope and, in a monorepo,
 * each non-private workspace package's: a package passes on its own `AGENTS.md`/`CLAUDE.md` or on a
 * scope file a root instructions file names inside it.
 */
function collectScope(
	dir: string,
	files: string[],
	fileSet: Set<string>,
	named: Set<string>,
	sections: string[],
	monorepo: { workspaces: unknown } | undefined,
): ScopeFacts {
	const isScopeDetail = (f: string, base: string) =>
		isScopeFileOf(f, base) || (read(dir, f) ?? '').split('\n').some((line) => SCOPE_HEADING.test(line))
	if (!monorepo) {
		return {
			linked: [...named].filter((f) => isScopeDetail(f, '')),
			unlinked: files.filter((f) => isScopeFileOf(f, '') && !named.has(f)),
			sections,
		}
	}
	const all = readWorkspacePackages(dir, monorepo.workspaces)
	const owner = (f: string) =>
		all.filter((p) => f.startsWith(`${p.dir}/`)).sort((a, b) => b.dir.length - a.dir.length)[0]
	const packages = all
		.filter((p) => !p.private)
		.map((p): PackageScope => {
			const ownNamed = new Set<string>()
			const ownSections: string[] = []
			const seen = new Set<string>()
			for (const base of PACKAGE_INSTRUCTION_FILES) {
				const file = `${p.dir}/${base}`
				const text = read(dir, file)
				if (text === undefined) continue
				const real = realpathSync(join(dir, file))
				if (seen.has(real)) continue
				seen.add(real)
				ownSections.push(...findScopeLines(file, text))
				for (const path of findNamedFiles(file, text, fileSet)) ownNamed.add(path)
			}
			const reached = [...named, ...ownNamed].filter((f) => owner(f) === p)
			return {
				dir: p.dir,
				name: p.name,
				linked: [...new Set(reached)].filter((f) => isScopeDetail(f, p.dir)),
				unlinked: files.filter((f) => isScopeFileOf(f, p.dir) && owner(f) === p && !reached.includes(f)),
				sections: ownSections,
			}
		})
	return {
		linked: [...named].filter((f) => owner(f) === undefined && isScopeDetail(f, '')),
		unlinked: files.filter((f) => isScopeFileOf(f, '') && !named.has(f)),
		sections,
		packages,
		privatePackages: all.filter((p) => p.private).map((p) => p.dir),
	}
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
	const harnessDoctor = findHarnessDoctor(dir)

	const instructionFiles: InstructionFile[] = []
	const missingInstructionCommands = new Set<string>()
	const fileSet = new Set(files)
	const named = new Set<string>()
	const scopeSections: string[] = []
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
		scopeSections.push(...findScopeLines(file, text))
		for (const path of findNamedFiles(file, text, fileSet)) named.add(path)
	}
	const isMonorepo = exists(dir, 'pnpm-workspace.yaml') || Array.isArray(pkg.workspaces) || exists(dir, 'lerna.json')
	const scope = collectScope(
		dir,
		files,
		fileSet,
		named,
		scopeSections,
		isMonorepo ? { workspaces: pkg.workspaces } : undefined,
	)

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
		scope,
		missingInstructionCommands: [...missingInstructionCommands],
		toolchainPins,
		hasLockfile: LOCKFILES.some((f) => exists(dir, f)),
		preCommitHooks,
		hasContributing: files.some((f) => /^(\.github\/|docs\/)?contributing(\.[a-z]+)?$/i.test(f)),
		hasIssueTemplates: exists(dir, '.github/ISSUE_TEMPLATE') || exists(dir, '.gitlab/issue_templates'),
		isMonorepo,
		tsStrict: readTsStrict(dir),
		largeFiles,
		trackedBuildOutput: files.filter((f) => BUILD_OUTPUT.test(f)),
		searchedFixtureDirs: isGitRepo ? findSearchedFixtureDirs(dir, files) : undefined,
		envIgnored,
		committedSecretFiles: files.filter((f) => SECRET_FILE.test(f) && !SECRET_FILE_ALLOWED.test(basename(f))),
		mcpLiteralCredentials: readMcpLiteralCredentials(dir),
		workflows: readWorkflows(dir),
		releaseAgeGate: readReleaseAgeGate(dir),
		injectionSurface: readInjectionSurface(dir),
		comments: measureComments(searched, readText),
		nameCollisions: findNameCollisions(searched, readText),
		undocumentedEnv: findUndocumentedEnv(
			searched,
			[...INSTRUCTION_FILES.filter((f) => exists(dir, f)), ...files.filter(isSetupDoc)],
			readText,
		),
		deadCodeCommand,
		...(options.runKnip && deadCodeCommand ? { deadCodeRun: runKnip(dir, deadCodeCommand) } : {}),
		...(harnessDoctor ? { harnessDoctor: runHarnessDoctor(dir, harnessDoctor) } : {}),
		benchBaselineAt: readBaseline(dir)?.createdAt,
	}
}
