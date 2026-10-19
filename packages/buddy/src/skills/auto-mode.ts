/*
 * Read, draft, and write Claude Code auto-mode settings for the init-buddy skill.
 *
 *   node scripts/auto-mode.mjs check    [--project <dir>] [--home <dir>]
 *   node scripts/auto-mode.mjs discover [--project <dir>] [--home <dir>]
 *   node scripts/auto-mode.mjs render   <answers.json>
 *   node scripts/auto-mode.mjs apply    <entries.json> [--home <dir>] [--write] [--verify]
 *
 *   check     what is set now: the mode, each autoMode list and whether it keeps "$defaults",
 *             template text left in an entry, autoMode blocks in project files (ignored there),
 *             and the Source control entry. Reads only the autoMode and permissions keys.
 *   discover  what gh can tell: the user's namespaces (personal account, org memberships with
 *             role and state), each one's repo visibility, this repo's default-branch rules, this
 *             repo's toolchain and release signals, and namespaces the Source control entry misses.
 *   render    the environment entries and autoMode.allow rules for the answers the user confirmed,
 *             with the deny entries each rule needs beside it.
 *   apply     appends rendered entries to ~/.claude/settings.json: a new list starts with
 *             "$defaults", existing entries are never removed or reordered, duplicates are skipped.
 *             `replace: [{ old, new }]` swaps one exact entry in place, for a refresh.
 *             Without --write it only prints what would change. --verify then checks
 *             `claude auto-mode config` shows the new entries.
 *
 * Every subcommand prints JSON. Exit 0 on success, 1 when gh or a file fails, 2 on bad usage.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { templateMarkers } from '../permissions/template-text.js'

const USAGE = `usage: auto-mode.mjs check    [--project <dir>] [--home <dir>]
       auto-mode.mjs discover [--project <dir>] [--home <dir>]
       auto-mode.mjs render   <answers.json>
       auto-mode.mjs apply    <entries.json> [--home <dir>] [--write] [--verify]
`

// Settings files are JSON of unknown shape.
type Json = any

interface Options {
	command: string
	file?: string
	project: string
	home: string
	write: boolean
	verify: boolean
}

class UsageError extends Error {}
class RunError extends Error {}

function parseArgs(argv: string[]): Options {
	const [command, ...rest] = argv
	if (!command || !['check', 'discover', 'render', 'apply'].includes(command)) throw new UsageError()
	const opts: Options = { command, project: process.cwd(), home: homedir(), write: false, verify: false }
	const positional: string[] = []
	for (let i = 0; i < rest.length; i++) {
		const a = rest[i]!
		if (a === '--project' || a === '--home') {
			const value = rest[++i]
			if (!value) throw new UsageError()
			opts[a === '--project' ? 'project' : 'home'] = resolve(value)
		} else if (a === '--write') opts.write = true
		else if (a === '--verify') opts.verify = true
		else if (a.startsWith('--')) throw new UsageError()
		else positional.push(a)
	}
	const needsFile = command === 'render' || command === 'apply'
	if (needsFile ? positional.length !== 1 : positional.length !== 0) throw new UsageError()
	if (positional[0]) opts.file = positional[0]
	return opts
}

// ── files ───────────────────────────────────────────────────────────────────

const userSettingsFile = (home: string) => join(home, '.claude', 'settings.json')
const projectSettingsFiles = (project: string) => [
	join(project, '.claude', 'settings.json'),
	join(project, '.claude', 'settings.local.json'),
]

function readJson(file: string): { exists: boolean; value: Json } {
	if (!existsSync(file)) return { exists: false, value: undefined }
	try {
		return { exists: true, value: JSON.parse(readFileSync(file, 'utf8')) }
	} catch (e) {
		throw new RunError(`could not parse ${file}: ${(e as Error).message}`)
	}
}

// ── check ───────────────────────────────────────────────────────────────────

const LISTS = ['environment', 'allow', 'soft_deny', 'hard_deny'] as const

/** The entry naming the user's namespaces, written by `render`. */
const SOURCE_CONTROL = /^\W*source control\W*:/i

export function check(project: string, home: string) {
	const userFile = userSettingsFile(home)
	const user = readJson(userFile)
	const autoMode: Json = user.value?.autoMode ?? {}

	const modes: { file: string; defaultMode: string }[] = []
	for (const file of [userFile, ...projectSettingsFiles(project)]) {
		const { value } = file === userFile ? user : readJson(file)
		const defaultMode = value?.permissions?.defaultMode
		if (typeof defaultMode === 'string') modes.push({ file, defaultMode })
	}

	const lists = Object.fromEntries(
		LISTS.map((key) => {
			const list = autoMode[key]
			if (!Array.isArray(list)) return [key, { exists: false, hasDefaults: false, count: 0 }]
			return [key, { exists: true, hasDefaults: list.includes('$defaults'), count: list.length }]
		}),
	)

	const templateText: { list: string; index: number; entry: string; markers: string[] }[] = []
	for (const key of ['environment', 'allow']) {
		const list = autoMode[key]
		if (!Array.isArray(list)) continue
		list.forEach((entry: unknown, index: number) => {
			if (typeof entry !== 'string' || entry === '$defaults') return
			const markers = templateMarkers(entry)
			if (markers.length) templateText.push({ list: key, index, entry, markers })
		})
	}

	const ignoredProjectBlocks = projectSettingsFiles(project).filter((file) => readJson(file).value?.autoMode)
	const missingDefaults = (['soft_deny', 'hard_deny'] as const).filter(
		(key) => lists[key]!.exists && !lists[key]!.hasDefaults,
	)
	const environment: unknown[] = Array.isArray(autoMode.environment) ? autoMode.environment : []
	const sourceControl =
		(environment.find((e) => typeof e === 'string' && SOURCE_CONTROL.test(e)) as string | undefined) ?? null

	return {
		settingsFile: userFile,
		settingsExists: user.exists,
		mode: { auto: modes.some((m) => m.defaultMode === 'auto'), sources: modes },
		lists,
		classifyAllShell: autoMode.classifyAllShell === true,
		templateText,
		ignoredProjectBlocks,
		missingDefaults,
		sourceControl,
	}
}

// ── discover ────────────────────────────────────────────────────────────────

function gh(args: string[], cwd?: string) {
	// Pass the env explicitly: under a test runner, `process.env` can be a copy the child would not see.
	const r = spawnSync('gh', args, { cwd, encoding: 'utf8', env: process.env })
	if (r.error) throw new RunError(`could not run gh: ${r.error.message}`)
	return { ok: r.status === 0, stdout: r.stdout ?? '', stderr: r.stderr ?? '' }
}

const tsv = (text: string) =>
	text
		.split('\n')
		.filter((line) => line.trim())
		.map((line) => line.split('\t'))

interface Namespace {
	owner: string
	kind: 'user' | 'org'
	role: string
	state: string
	proposed: boolean
	visibility?: Visibility
}

interface Visibility {
	summary: 'public' | 'private' | 'mixed' | 'empty'
	public: string[]
	private: string[]
}

function visibilityOf(owner: string): Visibility {
	const r = gh([
		'repo',
		'list',
		owner,
		'--limit',
		'1000',
		'--json',
		'name,visibility',
		'--jq',
		'.[] | [.name, .visibility] | @tsv',
	])
	if (!r.ok) throw new RunError(`gh repo list ${owner} failed: ${r.stderr.trim()}`)
	const rows = tsv(r.stdout)
	// `INTERNAL` repos are visible to the whole enterprise, not the public: treat them as private.
	const pub = rows.filter(([, v]) => v === 'PUBLIC').map(([name]) => name!)
	const priv = rows.filter(([, v]) => v !== 'PUBLIC').map(([name]) => name!)
	const summary = !rows.length ? 'empty' : !priv.length ? 'public' : !pub.length ? 'private' : 'mixed'
	return { summary, public: pub, private: priv }
}

function branchRules(project: string) {
	const view = gh(
		[
			'repo',
			'view',
			'--json',
			'nameWithOwner,defaultBranchRef',
			'--jq',
			'[.nameWithOwner, .defaultBranchRef.name] | @tsv',
		],
		project,
	)
	if (!view.ok) return null
	const [repo, defaultBranch] = tsv(view.stdout)[0] ?? []
	if (!repo || !defaultBranch) return null

	const out = {
		repo,
		defaultBranch,
		requiredChecks: [] as string[],
		requiredReviews: null as number | null,
		mergeQueue: false,
		forcePushBlocked: false,
		classicProtection: 'none' as 'none' | 'present' | 'unreadable',
	}
	const rules = gh(['api', `repos/${repo}/rules/branches/${defaultBranch}`])
	if (rules.ok) {
		for (const rule of JSON.parse(rules.stdout || '[]') as Json[]) {
			if (rule.type === 'required_status_checks')
				for (const c of rule.parameters?.required_status_checks ?? []) out.requiredChecks.push(c.context)
			if (rule.type === 'pull_request')
				out.requiredReviews = Math.max(out.requiredReviews ?? 0, rule.parameters?.required_approving_review_count ?? 0)
			if (rule.type === 'merge_queue') out.mergeQueue = true
			if (rule.type === 'non_fast_forward') out.forcePushBlocked = true
		}
	}
	// Classic protection: 404 when there is none, 403 without admin access.
	const classic = gh(['api', `repos/${repo}/branches/${defaultBranch}/protection`])
	if (classic.ok) {
		out.classicProtection = 'present'
		const p = JSON.parse(classic.stdout)
		const checks = p.required_status_checks
		for (const c of [...(checks?.contexts ?? []), ...(checks?.checks ?? []).map((x: Json) => x.context)])
			out.requiredChecks.push(c)
		const reviews = p.required_pull_request_reviews?.required_approving_review_count
		if (typeof reviews === 'number') out.requiredReviews = Math.max(out.requiredReviews ?? 0, reviews)
		if (p.allow_force_pushes?.enabled === false) out.forcePushBlocked = true
	} else if (/HTTP 403/.test(classic.stderr)) out.classicProtection = 'unreadable'
	out.requiredChecks = [...new Set(out.requiredChecks)]
	return out
}

const LOCKFILES: [string, string][] = [
	['pnpm-lock.yaml', 'pnpm'],
	['package-lock.json', 'npm'],
	['yarn.lock', 'yarn'],
	['bun.lock', 'bun'],
	['bun.lockb', 'bun'],
]
const PUBLISHES = /\b(npm|pnpm|yarn)\s+(\S+\s+)?publish\b|\bchangeset\s+publish\b|changesets\/action/

function repoSignals(project: string) {
	let packageManager: string | null = null
	const pkg = existsSync(join(project, 'package.json')) ? readJson(join(project, 'package.json')).value : undefined
	if (typeof pkg?.packageManager === 'string') packageManager = pkg.packageManager.split('@')[0]
	const lockfiles = LOCKFILES.filter(([file]) => existsSync(join(project, file)))
	packageManager ??= lockfiles[0]?.[1] ?? null
	const workflows = join(project, '.github', 'workflows')
	const publishWorkflows = existsSync(workflows)
		? readdirSync(workflows)
				.filter((f) => /\.ya?ml$/.test(f) && PUBLISHES.test(readFileSync(join(workflows, f), 'utf8')))
				.map((f) => `.github/workflows/${f}`)
		: []
	return {
		packageManager,
		lockfiles: lockfiles.map(([file]) => file),
		changesets: existsSync(join(project, '.changeset', 'config.json')),
		publishWorkflows,
	}
}

const mentions = (text: string, owner: string) =>
	new RegExp(`(?<![\\w-])${owner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`, 'i').test(text)

export function discover(project: string, home: string) {
	const login = gh(['api', 'user', '--jq', '.login'])
	if (!login.ok) throw new RunError(`gh is not logged in to GitHub: ${login.stderr.trim()}`)
	const errors: string[] = []
	const namespaces: Namespace[] = [
		{ owner: login.stdout.trim(), kind: 'user', role: 'owner', state: 'active', proposed: true },
	]
	const orgs = gh([
		'api',
		'--paginate',
		'user/memberships/orgs',
		'--jq',
		'.[] | [.organization.login, .role, .state] | @tsv',
	])
	if (orgs.ok)
		for (const [owner, role, state] of tsv(orgs.stdout))
			namespaces.push({
				owner: owner!,
				kind: 'org',
				role: role!,
				state: state!,
				proposed: role === 'admin' && state === 'active',
			})
	else errors.push(`could not list organization memberships (needs the read:org scope): ${orgs.stderr.trim()}`)

	for (const ns of namespaces) {
		if (ns.state !== 'active') continue
		try {
			ns.visibility = visibilityOf(ns.owner)
		} catch (e) {
			errors.push((e as Error).message)
		}
	}

	const sourceControl = check(project, home).sourceControl
	const missing = sourceControl
		? namespaces.filter((ns) => ns.proposed && !mentions(sourceControl, ns.owner)).map((ns) => ns.owner)
		: null

	return {
		host: 'github',
		login: namespaces[0]!.owner,
		namespaces,
		branch: branchRules(project),
		repo: repoSignals(project),
		refresh: { sourceControl, missing },
		errors,
	}
}

// ── render ──────────────────────────────────────────────────────────────────

const andList = (xs: string[]) =>
	xs.length <= 2 ? xs.join(' and ') : `${xs.slice(0, -1).join(', ')}, and ${xs[xs.length - 1]}`

const repos = (names: string[]) =>
	`the repo${names.length > 1 ? 's' : ''} ${andList(names)} ${names.length > 1 ? 'are' : 'is'}`

function sourceControlEntry(namespaces: { owner: string; kind: string }[]) {
	const users = namespaces.filter((ns) => ns.kind === 'user').map((ns) => ns.owner)
	const orgs = namespaces.filter((ns) => ns.kind !== 'user').map((ns) => ns.owner)
	const parts = [
		...(users.length ? [`the GitHub account${users.length > 1 ? 's' : ''} ${andList(users)}`] : []),
		...(orgs.length ? [`the GitHub organization${orgs.length > 1 ? 's' : ''} ${andList(orgs)}`] : []),
	]
	return `Source control: my namespaces, which other entries and rules refer to by that name, are ${parts.join(' and ')}, and every repo under them.`
}

function visibilityEntry(namespaces: { owner: string; visibility?: Visibility }[]) {
	const clauses: string[] = []
	for (const { owner, visibility: v } of namespaces) {
		if (!v || v.summary === 'empty') continue
		if (v.summary === 'public' || v.summary === 'private') clauses.push(`every repo in ${owner} is ${v.summary}`)
		else if (v.private.length <= v.public.length)
			clauses.push(`in ${owner}, ${repos(v.private)} private and the rest are public`)
		else clauses.push(`in ${owner}, ${repos(v.public)} public and the rest are private`)
	}
	return clauses.length ? `Repository visibility: in my namespaces, ${clauses.join('; ')}.` : null
}

const labelled = (label: string, text: unknown) => {
	if (typeof text !== 'string' || !text.trim()) return null
	const t = text.trim()
	return t.toLowerCase().startsWith(`${label.toLowerCase()}:`) ? t : `${label}: ${t}`
}

const ADMIN_DENY = ['Bash(gh pr merge --admin*)', 'Bash(gh pr merge * --admin*)']
const FORCE_PUSH_DENY = [
	'Bash(git push --force *)',
	'Bash(git push -f *)',
	'Bash(git push * --force)',
	'Bash(git push * --force *)',
	'Bash(git push * -f)',
	'Bash(git push * -f *)',
	'Bash(git push * +*)',
]

/** The GitHub rules from references/advanced-tier.md and references/auto-mode.md, owners as "my namespaces". */
export const RULES = {
	merge: {
		text: 'Merging a pull or merge request (`gh pr merge`, or adding it to the merge queue) without an approving review, in a repo in my namespaces, when the agent has confirmed first-hand that it has no merge conflict, every required check or pipeline is green, and no review requests changes or is left unresolved. Bypassing branch protection, branch policies, or required checks (`gh pr merge --admin`), merging while checks or pipelines are red or pending, or merging in a repo owned by anyone else is still not covered.',
		deny: ADMIN_DENY,
	},
	queuedMerge: {
		text: 'Queuing a pull request to merge once its checks pass (`gh pr merge --auto`, or adding it to the merge queue), for a pull request the agent opened or was asked to work on, in a repo in my namespaces whose base branch requires status checks, while those checks are still pending: the forge merges only after the required checks pass. `gh pr merge --admin`, queuing in a repo whose base branch requires no check, and changing branch protection are still not covered.',
		deny: ADMIN_DENY,
	},
	forceWithLease: {
		text: 'Force-pushing with `--force-with-lease` or `--force-if-includes` to a non-default branch of a repo in my namespaces, to update a branch after a rebase or amend. A plain `--force` or `-f`, a `+refspec`, and a force-push to the default branch, a release branch, or a branch someone else pushed to are still not covered.',
		deny: FORCE_PUSH_DENY,
	},
} as const

export function render(answers: Json) {
	const namespaces = answers?.namespaces
	if (
		!Array.isArray(namespaces) ||
		!namespaces.length ||
		!namespaces.every((ns: Json) => typeof ns?.owner === 'string' && ns.owner)
	)
		throw new RunError('answers.namespaces must be a non-empty array of { owner, kind } objects')
	const environment = [
		sourceControlEntry(namespaces),
		visibilityEntry(namespaces),
		labelled('Branch protection', answers.branchProtection),
		labelled('Toolchain', answers.toolchain),
		labelled('Release path', answers.releasePath),
		labelled('Host containment', answers.hostContainment),
		labelled('Key internal services', answers.keyInternalServices),
	].filter((e): e is string => Boolean(e))
	const wanted = (Object.keys(RULES) as (keyof typeof RULES)[]).filter((key) => answers.rules?.[key] === true)
	return {
		environment,
		allow: wanted.map((key) => RULES[key].text),
		deny: [...new Set(wanted.flatMap((key) => RULES[key].deny))],
	}
}

// ── apply ───────────────────────────────────────────────────────────────────

const strings = (value: unknown, name: string): string[] => {
	if (value === undefined) return []
	if (!Array.isArray(value) || !value.every((v) => typeof v === 'string'))
		throw new RunError(`${name} must be an array of strings`)
	return value
}

function indentOf(text: string) {
	const m = /^[ \t]+(?=")/m.exec(text)
	return m ? m[0] : '  '
}

export function apply(entries: Json, home: string, write: boolean, verify: boolean) {
	const wanted = {
		environment: strings(entries?.environment, 'environment'),
		allow: strings(entries?.allow, 'allow'),
		deny: strings(entries?.deny, 'deny'),
	}
	const replace: { old: string; new: string }[] = entries?.replace ?? []
	if (!Array.isArray(replace) || !replace.every((r) => typeof r?.old === 'string' && typeof r?.new === 'string'))
		throw new RunError('replace must be an array of { old, new } strings')
	const file = userSettingsFile(home)
	const original = existsSync(file) ? readFileSync(file, 'utf8') : null
	const settings: Json = original === null ? {} : readJson(file).value
	if (!settings || typeof settings !== 'object' || Array.isArray(settings))
		throw new RunError(`${file} does not hold a JSON object`)

	const snapshot = () => ({
		autoMode: { environment: settings.autoMode?.environment, allow: settings.autoMode?.allow },
		permissions: { deny: settings.permissions?.deny },
	})
	const before = JSON.parse(JSON.stringify(snapshot()))
	const added: Record<string, string[]> = { environment: [], allow: [], deny: [] }
	const skipped: Record<string, string[]> = { environment: [], allow: [], deny: [] }
	const replaced: { list: string; old: string; new: string }[] = []
	const notFound: string[] = []
	for (const r of replace) {
		const list = (['environment', 'allow'] as const).find((key) => settings.autoMode?.[key]?.includes(r.old))
		if (!list) notFound.push(r.old)
		else {
			const entries: string[] = settings.autoMode[list]
			entries[entries.indexOf(r.old)] = r.new
			replaced.push({ list, ...r })
		}
	}

	const append = (parent: Json, key: string, items: string[], name: string, withDefaults: boolean) => {
		if (!items.length) return
		if (!Array.isArray(parent[key])) parent[key] = withDefaults ? ['$defaults'] : []
		for (const item of items) {
			if (parent[key].includes(item)) skipped[name]!.push(item)
			else {
				parent[key].push(item)
				added[name]!.push(item)
			}
		}
	}
	if (wanted.environment.length || wanted.allow.length) settings.autoMode ??= {}
	if (wanted.deny.length) settings.permissions ??= {}
	append(settings.autoMode, 'environment', wanted.environment, 'environment', true)
	append(settings.autoMode, 'allow', wanted.allow, 'allow', true)
	append(settings.permissions, 'deny', wanted.deny, 'deny', false)

	const changed = replaced.length > 0 || Object.values(added).some((list) => list.length)
	let wrote = false
	let verified: boolean | null = null
	const notes: string[] = []
	if (write && changed) {
		mkdirSync(dirname(file), { recursive: true })
		writeFileSync(file, `${JSON.stringify(settings, null, original ? indentOf(original) : '  ')}\n`)
		const back = readJson(file).value
		for (const [key, list] of [
			['environment', back.autoMode?.environment],
			['allow', back.autoMode?.allow],
			['deny', back.permissions?.deny],
		] as const)
			if (
				[...added[key]!, ...replaced.filter((r) => r.list === key).map((r) => r.new)].some(
					(item) => !list?.includes(item),
				)
			)
				/* istanbul ignore next -- defensive read-back: a write that drops entries cannot be staged in a test */
				throw new RunError(`${file} lost ${key} entries on write`)
		wrote = true
	}
	if (verify && wrote) {
		const r = spawnSync('claude', ['auto-mode', 'config'], { encoding: 'utf8', env: { ...process.env, HOME: home } })
		if (r.error || r.status !== 0) notes.push('`claude auto-mode config` did not run; check the entries by hand')
		else {
			const config = JSON.parse(r.stdout)
			verified = (['environment', 'allow'] as const).every((key) =>
				[...added[key]!, ...replaced.filter((r) => r.list === key).map((r) => r.new)].every((item) =>
					config[key]?.includes(item),
				),
			)
		}
	}
	if (notFound.length) notes.push(`not replaced, no such entry: ${notFound.join(' | ')}`)
	return { file, changed, wrote, verified, added, replaced, skipped, before, after: snapshot(), notes }
}

// ── main ────────────────────────────────────────────────────────────────────

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
	let opts: Options
	try {
		opts = parseArgs(argv)
	} catch {
		process.stderr.write(USAGE)
		process.exit(2)
	}
	try {
		const input = opts.file ? readJson(resolve(opts.file)) : undefined
		if (opts.file && !input?.exists) throw new RunError(`${opts.file} does not exist`)
		const result =
			opts.command === 'check'
				? check(opts.project, opts.home)
				: opts.command === 'discover'
					? discover(opts.project, opts.home)
					: opts.command === 'render'
						? render(input!.value)
						: apply(input!.value, opts.home, opts.write, opts.verify)
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
	} catch (e) {
		if (!(e instanceof RunError)) throw e
		process.stderr.write(`auto-mode: ${e.message}\n`)
		process.exit(1)
	}
}

// Process-boundary guard: only fires when the bundle runs directly as a script.
/* istanbul ignore next -- process.argv entrypoint guard, covered by bundles.spec.ts (child process) */
if (process.argv[1]?.endsWith('auto-mode.mjs')) await main()
