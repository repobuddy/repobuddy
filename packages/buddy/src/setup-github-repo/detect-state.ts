/**
 * Detects current GitHub repo settings and filesystem signals, and writes the state artifact
 * `scaffold-workflows` reads. See `state-path.ts` for why the artifact lives outside the repo tree.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, resolve } from 'node:path'
import { type Exec, realExec, runJson } from './exec.js'
import { stateArtifactPath } from './state-path.js'

interface RepoSettings {
	delete_branch_on_merge: boolean
	allow_auto_merge: boolean
	allow_merge_commit: boolean
	allow_squash_merge: boolean
	allow_rebase_merge: boolean
	allow_update_branch: boolean
	has_wiki: boolean
	has_projects: boolean
	has_discussions: boolean
	private?: boolean
	owner?: { type?: string }
	security_and_analysis?: {
		dependabot_security_updates?: { status: string }
		secret_scanning?: { status: string }
		secret_scanning_push_protection?: { status: string }
	}
}

interface Ruleset {
	id: number
	name: string
	target: string
	enforcement: string
	conditions?: unknown
	rules?: Array<{ type: string }>
}

/** One rule as `GET repos/{repo}/rules/branches/{branch}` reports it: every active rule on the branch, from any ruleset. */
interface BranchRule {
	type: string
	parameters?: { strict_required_status_checks_policy?: boolean }
}

/**
 * Whether a merge into the default branch is tested against the latest default branch before it lands,
 * whoever runs the merge. Any one of the three is a backstop.
 */
interface MergeBackstop {
	/** A ruleset requires the native GitHub merge queue on the default branch. */
	mergeQueue: boolean
	/** A ruleset or classic branch protection requires the branch to be up to date before merging. */
	strictUpToDate: boolean
	/** A third-party merge queue's config file in the repo, e.g. `{ tool: 'mergify', config: '.mergify.yml' }`. */
	thirdPartyQueue: { tool: string; config: string } | null
	/**
	 * Whether GitHub offers a merge queue on this repo: public organization repos have it; private
	 * organization repos have it only on GitHub Enterprise Cloud, which the API does not report; personal
	 * repos never have it.
	 */
	mergeQueueAvailability: 'available' | 'enterprise-cloud-only' | 'unavailable'
}

const THIRD_PARTY_QUEUE_CONFIGS: Array<{ tool: string; config: string }> = [
	{ tool: 'mergify', config: '.mergify.yml' },
	{ tool: 'mergify', config: '.mergify/config.yml' },
	{ tool: 'mergify', config: '.github/mergify.yml' },
	{ tool: 'kodiak', config: '.kodiak.toml' },
	{ tool: 'kodiak', config: '.github/.kodiak.toml' },
]

interface Row {
	setting: string
	current: string
	target: string
	action: string
}

interface State {
	repo: string
	defaultBranch: string
	current: {
		deleteBranchOnMerge: boolean
		allowAutoMerge: boolean
		allowMergeCommit: boolean
		allowSquashMerge: boolean
		allowRebaseMerge: boolean
		allowUpdateBranch: boolean
		hasWiki: boolean
		hasProjects: boolean
		hasDiscussions: boolean
		dependabotSecurityUpdates: string
		secretScanning: string
		secretScanningPushProtection: string
		defaultBranchRuleset: { id: number; name: string } | null
		mergeBackstop: MergeBackstop
	}
	detected: {
		language: string | null
		codeqlLanguage: string | null
		packageManager: string | null
		hasPackageJson: boolean
		hasDependabotConfig: boolean
		existingWorkflows: string[]
		/** Existing workflows that trigger on `merge_group`, the event a native merge queue runs CI on. */
		mergeGroupWorkflows: string[]
	}
	rows: Row[]
}

interface DetectStateAck {
	ok: true
	artifact: string
	removedLegacyArtifact?: string
	repo: string
	defaultBranch: string
	counts: { willSet: number; alreadySet: number }
}

export interface DetectStateOptions {
	/** Repo working directory to scan for language/package-manager/workflow signals. Defaults to cwd. */
	dir?: string
	/** Where to write the state artifact. Defaults to the deterministic per-repo temp path. */
	out?: string
	exec?: Exec
}

const SOURCE_EXTENSIONS: Record<string, string> = {
	'.ts': 'typescript',
	'.tsx': 'typescript',
	'.mts': 'typescript',
	'.cts': 'typescript',
	'.js': 'javascript',
	'.mjs': 'javascript',
	'.cjs': 'javascript',
	'.jsx': 'javascript',
	'.py': 'python',
	'.go': 'go',
	'.rs': 'rust',
	'.java': 'java',
	'.rb': 'ruby',
	'.cs': 'csharp',
	'.cpp': 'cpp',
	'.c': 'cpp',
}

const CODEQL_LANGUAGE_MAP: Record<string, string> = {
	typescript: 'javascript',
	javascript: 'javascript',
	python: 'python',
	go: 'go',
	rust: 'swift', // CodeQL doesn't support Rust yet; leave as placeholder
	java: 'java',
	ruby: 'ruby',
	csharp: 'csharp',
	cpp: 'cpp',
}

function detectLanguage(dir: string): string | null {
	const counts: Record<string, number> = {}
	function scan(current: string, depth = 0) {
		if (depth > 3) return
		try {
			for (const entry of readdirSync(current, { withFileTypes: true })) {
				if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
				const fullPath = join(current, entry.name)
				if (entry.isDirectory()) {
					scan(fullPath, depth + 1)
				} else {
					const lang = SOURCE_EXTENSIONS[extname(entry.name)]
					if (lang) counts[lang] = (counts[lang] ?? 0) + 1
				}
			}
		} catch {
			/* skip unreadable dirs */
		}
	}
	scan(dir)
	const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
	return sorted[0]?.[0] ?? null
}

function detectPackageManager(dir: string): string | null {
	if (existsSync(join(dir, 'pnpm-lock.yaml'))) return 'pnpm'
	if (existsSync(join(dir, 'bun.lock')) || existsSync(join(dir, 'bun.lockb'))) return 'bun'
	if (existsSync(join(dir, 'yarn.lock'))) return 'yarn'
	if (existsSync(join(dir, 'package-lock.json'))) return 'npm'
	return null
}

function detectThirdPartyQueue(dir: string): MergeBackstop['thirdPartyQueue'] {
	return THIRD_PARTY_QUEUE_CONFIGS.find(({ config }) => existsSync(join(dir, config))) ?? null
}

function mergeQueueAvailability(settings: RepoSettings): MergeBackstop['mergeQueueAvailability'] {
	if (settings.owner?.type !== 'Organization') return 'unavailable'
	return settings.private ? 'enterprise-cloud-only' : 'available'
}

function describeBackstop(backstop: MergeBackstop): string {
	if (backstop.mergeQueue) return 'merge queue'
	if (backstop.thirdPartyQueue) return `${backstop.thirdPartyQueue.tool} (${backstop.thirdPartyQueue.config})`
	if (backstop.strictUpToDate) return 'require up to date'
	return 'none'
}

function triggersOnMergeGroup(file: string): boolean {
	try {
		return /^\s*merge_group\s*:|^on:.*\bmerge_group\b|^\s*-\s*merge_group\s*$/m.test(readFileSync(file, 'utf8'))
	} catch {
		return false
	}
}

function buildRows(current: State['current']): Row[] {
	return [
		{
			setting: 'delete_branch_on_merge',
			current: String(current.deleteBranchOnMerge),
			target: 'true',
			action: current.deleteBranchOnMerge ? 'already set' : 'will set',
		},
		{
			setting: 'allow_auto_merge',
			current: String(current.allowAutoMerge),
			target: 'true',
			action: current.allowAutoMerge ? 'already set' : 'will set',
		},
		{
			setting: 'allow_merge_commit',
			current: String(current.allowMergeCommit),
			target: 'false',
			action: !current.allowMergeCommit ? 'already set' : 'will set',
		},
		{
			setting: 'allow_squash_merge',
			current: String(current.allowSquashMerge),
			target: 'true',
			action: current.allowSquashMerge ? 'already set' : 'will set',
		},
		{
			setting: 'allow_rebase_merge',
			current: String(current.allowRebaseMerge),
			target: 'true',
			action: current.allowRebaseMerge ? 'already set' : 'will set',
		},
		{
			setting: 'allow_update_branch',
			current: String(current.allowUpdateBranch),
			target: 'true',
			action: current.allowUpdateBranch ? 'already set' : 'will set',
		},
		{
			setting: 'dependabot_security_updates',
			current: current.dependabotSecurityUpdates,
			target: 'enabled',
			action: current.dependabotSecurityUpdates === 'enabled' ? 'already set' : 'will set',
		},
		{
			setting: 'default branch ruleset',
			current: current.defaultBranchRuleset ? `exists (${current.defaultBranchRuleset.name})` : 'none',
			target: 'default-branch-protection',
			action: current.defaultBranchRuleset ? 'already set' : 'will create',
		},
		{
			setting: 'merge backstop',
			current: describeBackstop(current.mergeBackstop),
			target: current.mergeBackstop.mergeQueueAvailability === 'unavailable' ? 'require up to date' : 'merge queue',
			action: describeBackstop(current.mergeBackstop) === 'none' ? 'will offer' : 'already set',
		},
	]
}

export interface DetectStateResult {
	ack: DetectStateAck
	state: State
}

export function detectState(options: DetectStateOptions = {}): DetectStateResult {
	const dir = resolve(options.dir ?? process.cwd())
	const exec = options.exec ?? realExec

	const nameWithOwner = exec.run('gh repo view --json nameWithOwner --jq .nameWithOwner')
	const defaultBranch = exec.run('gh repo view --json defaultBranchRef --jq .defaultBranchRef.name')

	const repoSettings = runJson<RepoSettings>(exec, `gh api repos/${nameWithOwner}`) ?? ({} as RepoSettings)

	const rulesets = runJson<Ruleset[]>(exec, `gh api repos/${nameWithOwner}/rulesets`) ?? []
	const defaultBranchRuleset = rulesets.find(
		(r) =>
			r.target === 'branch' && r.enforcement === 'active' && JSON.stringify(r.conditions)?.includes('~DEFAULT_BRANCH'),
	)

	const reportedRules = runJson<BranchRule[]>(
		exec,
		`gh api repos/${nameWithOwner}/rules/branches/${encodeURIComponent(defaultBranch)}`,
	)
	const branchRules = Array.isArray(reportedRules) ? reportedRules : []
	// Classic branch protection can also require an up-to-date branch; the call fails (404) when there is none.
	const classicChecks = runJson<{ strict?: boolean }>(
		exec,
		`gh api repos/${nameWithOwner}/branches/${encodeURIComponent(defaultBranch)}/protection/required_status_checks`,
	)
	const mergeBackstop: MergeBackstop = {
		mergeQueue: branchRules.some((r) => r.type === 'merge_queue'),
		strictUpToDate:
			branchRules.some(
				(r) => r.type === 'required_status_checks' && r.parameters?.strict_required_status_checks_policy === true,
			) || classicChecks?.strict === true,
		thirdPartyQueue: detectThirdPartyQueue(dir),
		mergeQueueAvailability: mergeQueueAvailability(repoSettings),
	}

	const workflowsDir = join(dir, '.github', 'workflows')
	const existingWorkflows = existsSync(workflowsDir) ? readdirSync(workflowsDir) : []
	const mergeGroupWorkflows = existingWorkflows.filter((f) => triggersOnMergeGroup(join(workflowsDir, f)))

	const language = detectLanguage(dir)
	const packageManager = detectPackageManager(dir)
	const hasPackageJson = existsSync(join(dir, 'package.json'))
	const hasDependabotConfig = existsSync(join(dir, '.github', 'dependabot.yml'))

	const current: State['current'] = {
		deleteBranchOnMerge: repoSettings.delete_branch_on_merge ?? false,
		allowAutoMerge: repoSettings.allow_auto_merge ?? false,
		allowMergeCommit: repoSettings.allow_merge_commit ?? true,
		allowSquashMerge: repoSettings.allow_squash_merge ?? true,
		allowRebaseMerge: repoSettings.allow_rebase_merge ?? true,
		allowUpdateBranch: repoSettings.allow_update_branch ?? false,
		hasWiki: repoSettings.has_wiki ?? false,
		hasProjects: repoSettings.has_projects ?? false,
		hasDiscussions: repoSettings.has_discussions ?? false,
		dependabotSecurityUpdates: repoSettings.security_and_analysis?.dependabot_security_updates?.status ?? 'disabled',
		secretScanning: repoSettings.security_and_analysis?.secret_scanning?.status ?? 'disabled',
		secretScanningPushProtection:
			repoSettings.security_and_analysis?.secret_scanning_push_protection?.status ?? 'disabled',
		defaultBranchRuleset: defaultBranchRuleset
			? { id: defaultBranchRuleset.id, name: defaultBranchRuleset.name }
			: null,
		mergeBackstop,
	}

	const rows = buildRows(current)

	const state: State = {
		repo: nameWithOwner,
		defaultBranch,
		current,
		detected: {
			language,
			codeqlLanguage: language ? (CODEQL_LANGUAGE_MAP[language] ?? 'javascript') : null,
			packageManager,
			hasPackageJson,
			hasDependabotConfig,
			existingWorkflows,
			mergeGroupWorkflows,
		},
		rows,
	}

	const artifact = options.out ?? stateArtifactPath(nameWithOwner)
	mkdirSync(dirname(artifact), { recursive: true })
	writeFileSync(artifact, JSON.stringify(state, null, 2))

	// Earlier versions of this skill wrote the artifact into the repo tree, where it was
	// left behind untracked. Clear that leftover so it stops reading as repo policy.
	const legacyArtifact = join(dir, '.github', 'setup-state.json')
	const removedLegacyArtifact = resolve(legacyArtifact) !== resolve(artifact) && existsSync(legacyArtifact)
	if (removedLegacyArtifact) rmSync(legacyArtifact, { force: true })

	const willSet = rows.filter((r) => r.action.startsWith('will')).length
	const alreadySet = rows.length - willSet

	const ack: DetectStateAck = {
		ok: true,
		artifact,
		...(removedLegacyArtifact ? { removedLegacyArtifact: legacyArtifact } : {}),
		repo: nameWithOwner,
		defaultBranch,
		counts: { willSet, alreadySet },
	}

	return { ack, state }
}
