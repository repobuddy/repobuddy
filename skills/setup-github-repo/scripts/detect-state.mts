#!/usr/bin/env node
/**
 * Detects current GitHub repo settings and filesystem signals.
 * Writes .github/setup-state.json and prints a diff table to stdout.
 */

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { extname, join } from 'node:path'

function run(cmd: string): string {
	return execSync(cmd, { encoding: 'utf8' }).trim()
}

function runJson<T>(cmd: string): T | null {
	try {
		return JSON.parse(run(cmd)) as T
	} catch {
		return null
	}
}

// --- Repo identity ---

const nameWithOwner = run('gh repo view --json nameWithOwner --jq .nameWithOwner')
const defaultBranch = run('gh repo view --json defaultBranchRef --jq .defaultBranchRef.name')

// --- Current repo settings ---

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
	security_and_analysis?: {
		dependabot_security_updates?: { status: string }
		secret_scanning?: { status: string }
		secret_scanning_push_protection?: { status: string }
	}
}

const repoSettings = runJson<RepoSettings>(`gh api repos/${nameWithOwner}`) ?? ({} as RepoSettings)

// --- Rulesets ---

interface Ruleset {
	id: number
	name: string
	target: string
	enforcement: string
	conditions?: unknown
	rules?: Array<{ type: string }>
}

const rulesets = runJson<Ruleset[]>(`gh api repos/${nameWithOwner}/rulesets`) ?? []
const defaultBranchRuleset = rulesets.find(
	(r) =>
		r.target === 'branch' && r.enforcement === 'active' && JSON.stringify(r.conditions)?.includes('~DEFAULT_BRANCH'),
)

// --- Existing workflows ---

const workflowsDir = '.github/workflows'
const existingWorkflows = existsSync(workflowsDir) ? readdirSync(workflowsDir) : []

// --- Language detection ---

const sourceExtensions: Record<string, string> = {
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

const codeqlLanguageMap: Record<string, string> = {
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

function detectLanguage(): string | null {
	const counts: Record<string, number> = {}
	function scan(dir: string, depth = 0) {
		if (depth > 3) return
		try {
			for (const entry of readdirSync(dir, { withFileTypes: true })) {
				if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
				const fullPath = join(dir, entry.name)
				if (entry.isDirectory()) {
					scan(fullPath, depth + 1)
				} else {
					const lang = sourceExtensions[extname(entry.name)]
					if (lang) counts[lang] = (counts[lang] ?? 0) + 1
				}
			}
		} catch {
			/* skip unreadable dirs */
		}
	}
	scan('.')
	const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
	return sorted[0]?.[0] ?? null
}

// --- Package manager detection ---

function detectPackageManager(): string | null {
	if (existsSync('pnpm-lock.yaml')) return 'pnpm'
	if (existsSync('bun.lock') || existsSync('bun.lockb')) return 'bun'
	if (existsSync('yarn.lock')) return 'yarn'
	if (existsSync('package-lock.json')) return 'npm'
	return null
}

// --- Build state ---

const language = detectLanguage()
const packageManager = detectPackageManager()
const hasPackageJson = existsSync('package.json')
const hasDependabotConfig = existsSync('.github/dependabot.yml')

const state = {
	repo: nameWithOwner,
	defaultBranch,
	current: {
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
	},
	detected: {
		language,
		codeqlLanguage: language ? (codeqlLanguageMap[language] ?? 'javascript') : null,
		packageManager,
		hasPackageJson,
		hasDependabotConfig,
		existingWorkflows,
	},
}

// --- Write state file ---

mkdirSync('.github', { recursive: true })
writeFileSync('.github/setup-state.json', JSON.stringify(state, null, 2))

// --- Print diff table ---

interface Row {
	setting: string
	current: string
	target: string
	action: string
}

const rows: Row[] = [
	{
		setting: 'delete_branch_on_merge',
		current: String(state.current.deleteBranchOnMerge),
		target: 'true',
		action: state.current.deleteBranchOnMerge ? 'already set' : 'will set',
	},
	{
		setting: 'allow_auto_merge',
		current: String(state.current.allowAutoMerge),
		target: 'true',
		action: state.current.allowAutoMerge ? 'already set' : 'will set',
	},
	{
		setting: 'allow_merge_commit',
		current: String(state.current.allowMergeCommit),
		target: 'false',
		action: !state.current.allowMergeCommit ? 'already set' : 'will set',
	},
	{
		setting: 'allow_squash_merge',
		current: String(state.current.allowSquashMerge),
		target: 'true',
		action: state.current.allowSquashMerge ? 'already set' : 'will set',
	},
	{
		setting: 'allow_rebase_merge',
		current: String(state.current.allowRebaseMerge),
		target: 'true',
		action: state.current.allowRebaseMerge ? 'already set' : 'will set',
	},
	{
		setting: 'allow_update_branch',
		current: String(state.current.allowUpdateBranch),
		target: 'true',
		action: state.current.allowUpdateBranch ? 'already set' : 'will set',
	},
	{
		setting: 'dependabot_security_updates',
		current: state.current.dependabotSecurityUpdates,
		target: 'enabled',
		action: state.current.dependabotSecurityUpdates === 'enabled' ? 'already set' : 'will set',
	},
	{
		setting: 'default branch ruleset',
		current: state.current.defaultBranchRuleset ? `exists (${state.current.defaultBranchRuleset.name})` : 'none',
		target: 'default-branch-protection',
		action: state.current.defaultBranchRuleset ? 'already set' : 'will create',
	},
]

const colWidths = [
	Math.max(...rows.map((r) => r.setting.length), 'Setting'.length),
	Math.max(...rows.map((r) => r.current.length), 'Current'.length),
	Math.max(...rows.map((r) => r.target.length), 'Target'.length),
	Math.max(...rows.map((r) => r.action.length), 'Action'.length),
]

function pad(s: string, n: number) {
	return s.padEnd(n)
}
function row(cols: string[]) {
	return '| ' + cols.map((c, i) => pad(c, colWidths[i]!)).join(' | ') + ' |'
}
function divider() {
	return '|-' + colWidths.map((w) => '-'.repeat(w)).join('-|-') + '-|'
}

console.log(`\nRepo: ${nameWithOwner}  (default branch: ${defaultBranch})\n`)
console.log(row(['Setting', 'Current', 'Target', 'Action']))
console.log(divider())
for (const r of rows) {
	console.log(row([r.setting, r.current, r.target, r.action]))
}

console.log('\nDetected:')
console.log(`  Language:        ${language ?? 'unknown'}`)
console.log(`  CodeQL language: ${state.detected.codeqlLanguage ?? 'unknown'}`)
console.log(`  Package manager: ${packageManager ?? 'none'}`)
console.log(`  Existing workflows: ${existingWorkflows.length > 0 ? existingWorkflows.join(', ') : 'none'}`)
console.log('\nState written to .github/setup-state.json')
