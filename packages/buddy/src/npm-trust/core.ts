/**
 * Plans and applies npm trusted publishing (OIDC) config across one or many repos.
 *
 * `plan` resolves scope to a package list and writes `.github/npm-trust-plan.json`.
 * `apply` executes the plan, one `npm trust github` call per package.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { type NpmTrustGithub, realNpmTrustGithub, realSh, realWait, type Sh, shJson, type Wait } from './exec.js'

const PLAN_FILE = 'npm-trust-plan.json'

type Row = {
	package: string
	repo: string
	workflow: string
	action: 'configure' | 'already-configured' | 'not-published' | 'private'
	note?: string
}

export interface NpmTrustDeps {
	sh?: Sh
	npmTrustGithub?: NpmTrustGithub
	wait?: Wait
	log?: (message: string) => void
}

function ghFile(sh: Sh, repo: string, path: string): string | null {
	try {
		const b64 = sh(`gh api repos/${repo}/contents/${path} --jq .content`)
		return Buffer.from(b64, 'base64').toString('utf8')
	} catch {
		return null
	}
}

function ghDirs(sh: Sh, repo: string, path: string): string[] {
	const out = shJson<Array<{ name: string; type: string }>>(sh, `gh api repos/${repo}/contents/${path}`)
	return (out ?? []).filter((e) => e.type === 'dir').map((e) => e.name)
}

function listRepos(sh: Sh, owner: string): string[] {
	// Source repos only. Forks are someone else's to publish.
	const names = sh(
		`gh repo list ${owner} --source --no-archived --limit 500 --json nameWithOwner --jq ".[].nameWithOwner"`,
	)
	return names ? names.split('\n').filter(Boolean) : []
}

export interface ResolveScopeOptions {
	package?: string | undefined
	repo?: string | undefined
	org?: string | undefined
	allOrgs?: boolean | undefined
}

export function resolveRepos(sh: Sh, scope: ResolveScopeOptions, log: (message: string) => void): string[] {
	if (scope.repo) return [scope.repo]

	if (scope.org) return listRepos(sh, scope.org)

	if (scope.allOrgs) {
		const me = sh('gh api user --jq .login')
		const orgs = sh('gh api user/orgs --jq ".[].login"').split('\n').filter(Boolean)
		log(`owner: ${me}; orgs: ${orgs.join(', ') || '(none)'}`)
		return [me, ...orgs].flatMap((o) => listRepos(sh, o))
	}

	throw new Error('scope required: --package <name> | --repo <owner/name> | --org <login> | --all-orgs')
}

function parsePnpmWorkspace(sh: Sh, repo: string): string[] {
	const raw = ghFile(sh, repo, 'pnpm-workspace.yaml')
	if (!raw) return []
	const globs: string[] = []
	let inPackages = false
	for (const line of raw.split('\n')) {
		if (/^packages:/.test(line)) {
			inPackages = true
			continue
		}
		if (inPackages) {
			const m = /^\s+-\s+['"]?([^'"\s]+)['"]?/.exec(line)
			if (m?.[1]) globs.push(m[1])
			else if (/^\S/.test(line)) inPackages = false
		}
	}
	return globs
}

/** npm trust config is per PACKAGE NAME, not per repo, so monorepos yield many rows. */
export function derivePackages(sh: Sh, repo: string): Array<{ name: string }> {
	const rootRaw = ghFile(sh, repo, 'package.json')
	if (!rootRaw) return []

	let root: { private?: boolean; name?: string; workspaces?: string[] | { packages?: string[] } }
	try {
		root = JSON.parse(rootRaw)
	} catch {
		return []
	}

	if (!root.private && root.name) return [{ name: root.name }]

	// Private root => monorepo. Resolve workspace globs, then fall back to a top-level scan.
	const globs: string[] = Array.isArray(root.workspaces)
		? root.workspaces
		: Array.isArray(root.workspaces?.packages)
			? (root.workspaces?.packages as string[])
			: parsePnpmWorkspace(sh, repo)

	const dirs = new Set<string>()
	for (const g of globs) {
		const m = /^([^*]+)\/\*$/.exec(g)
		if (m?.[1]) for (const d of ghDirs(sh, repo, m[1])) dirs.add(`${m[1]}/${d}`)
		else if (!g.includes('*')) dirs.add(g)
	}
	if (dirs.size === 0) for (const d of ghDirs(sh, repo, '')) dirs.add(d)

	const out: Array<{ name: string }> = []
	for (const d of dirs) {
		if (d.startsWith('.')) continue
		const raw = ghFile(sh, repo, `${d}/package.json`)
		if (!raw) continue
		try {
			const p = JSON.parse(raw)
			if (p.name && !p.private) out.push({ name: p.name })
		} catch {
			/* ignore unparseable */
		}
	}
	return out
}

/**
 * npm validates the CALLER workflow, not the reusable one it delegates to.
 * A workflow qualifies only if it both triggers on push to the default branch AND
 * actually publishes; scoring then prefers one named `release`.
 */
export function detectCallerWorkflow(sh: Sh, repo: string): { workflow: string; confident: boolean } {
	const files = shJson<Array<{ name: string }>>(sh, `gh api repos/${repo}/contents/.github/workflows`) ?? []
	const names = files.map((f) => f.name).filter((n) => /\.ya?ml$/.test(n))

	const scored: Array<{ name: string; score: number }> = []
	for (const n of names) {
		const body = ghFile(sh, repo, `.github/workflows/${n}`) ?? ''
		// Alternation must be grouped, or `main|master` matches anywhere in the file.
		if (!/push:[\s\S]{0,300}?branches:\s*\[?\s*['"]?(main|master)\b/.test(body)) continue
		if (
			!/(changeset\s+publish|npm\s+publish|semantic-release|release-changeset|release-semantic|npm-release|yarn2-library-release)/i.test(
				body,
			)
		)
			continue
		let score = 0
		if (/^release\.ya?ml$/i.test(n)) score += 2
		else if (/release|publish/i.test(n)) score += 1
		scored.push({ name: n, score })
	}
	scored.sort((a, b) => b.score - a.score)

	const top = scored[0]
	if (top) return { workflow: top.name, confident: scored.length === 1 || top.score > 0 }
	// Nothing matched: fall back, but say so rather than assert a guess.
	return { workflow: names.includes('release.yml') ? 'release.yml' : (names[0] ?? 'release.yml'), confident: false }
}

export function isPublished(sh: Sh, pkg: string): boolean {
	try {
		sh(`npm view ${pkg} version`)
		return true
	} catch {
		return false
	}
}

export interface PlanOptions {
	package?: string | undefined
	repo?: string | undefined
	org?: string | undefined
	allOrgs?: boolean | undefined
	file?: string | undefined
	dir?: string | undefined
}

export interface PlanResult {
	ok: true
	plan: string
	total: number
	counts: Record<string, number>
	rows: Row[]
}

export function plan(options: PlanOptions, deps: NpmTrustDeps = {}): PlanResult {
	const sh = deps.sh ?? realSh
	const log = deps.log ?? (() => {})
	const planPath = join(options.dir ?? '.', '.github', PLAN_FILE)
	const rows: Row[] = []

	if (options.package) {
		const repo = options.repo
		if (!repo) throw new Error('--package requires --repo <owner/name>')
		const det = options.file ? { workflow: options.file, confident: true } : detectCallerWorkflow(sh, repo)
		rows.push({
			package: options.package,
			repo,
			workflow: det.workflow,
			action: isPublished(sh, options.package) ? 'configure' : 'not-published',
			...(det.confident ? {} : { note: 'workflow guessed - confirm before applying' }),
		})
	} else {
		for (const repo of resolveRepos(sh, options, log)) {
			log(`[scanning] ${repo}`)
			const pkgs = derivePackages(sh, repo)
			if (pkgs.length === 0) {
				rows.push({ package: '-', repo, workflow: '-', action: 'private', note: 'nothing published' })
				continue
			}
			const det = detectCallerWorkflow(sh, repo)
			for (const p of pkgs) {
				rows.push({
					package: p.name,
					repo,
					workflow: det.workflow,
					action: isPublished(sh, p.name) ? 'configure' : 'not-published',
					...(det.confident ? {} : { note: 'workflow guessed - confirm before applying' }),
				})
			}
		}
	}

	mkdirSync(dirname(planPath), { recursive: true })
	writeFileSync(planPath, `${JSON.stringify({ generated: true, rows }, null, 2)}\n`)

	for (const r of rows) log(`${r.action.padEnd(18)} ${r.package} <- ${r.repo}/${r.workflow}`)

	const counts = rows.reduce<Record<string, number>>((a, r) => ((a[r.action] = (a[r.action] ?? 0) + 1), a), {})
	return { ok: true, plan: planPath, total: rows.length, counts, rows }
}

export interface ApplyOptions {
	otp?: string | undefined
	dir?: string | undefined
}

export type ApplyResult =
	| { ok: boolean; configured: number; alreadyConfigured: number; failed: number }
	| { ok: false; configured: number; failed: number; stoppedOn: string; reason: 'auth' }

export function apply(options: ApplyOptions, deps: NpmTrustDeps = {}): ApplyResult {
	const npmTrustGithub = deps.npmTrustGithub ?? realNpmTrustGithub
	const wait = deps.wait ?? realWait
	const log = deps.log ?? (() => {})

	const planPath = join(options.dir ?? '.', '.github', PLAN_FILE)
	if (!existsSync(planPath)) throw new Error(`no plan at ${planPath}; run plan first`)
	const otp = options.otp
	if (!otp) throw new Error('--otp=<code> required; npm enforces 2FA on trust operations')

	const planFile = JSON.parse(readFileSync(planPath, 'utf8')) as { rows: Row[] }
	const todo = planFile.rows.filter((r) => r.action === 'configure')

	let ok = 0
	let failed = 0
	let already = 0
	for (const r of todo) {
		// --otp=VALUE must use the equals form: `npm trust github` takes a positional
		// package name, so a space-separated value is consumed as that positional.
		const args = [
			'trust',
			'github',
			r.package,
			'--file',
			r.workflow,
			'--repo',
			r.repo,
			'--allow-publish',
			'-y',
			`--otp=${otp}`,
		]
		try {
			npmTrustGithub(args)
			log(`[ok]     ${r.package}`)
			ok++
		} catch (e) {
			const err = e instanceof Error ? e.message : String(e)
			// `npm trust github` POSTs to /-/package/<name>/trust, so a 409 means a
			// trusted publisher already exists for that package — the desired end
			// state, not a failure. Planning cannot tell these apart beforehand:
			// reading the current trust config needs `npm trust list`, which requires
			// an OTP, and `plan` deliberately takes none. So every already-trusted
			// package surfaces here rather than as `already-configured` in the plan.
			//
			// Reported, not silent: a pre-existing entry may point at a different repo
			// or workflow than the plan intends, and that only shows up at publish time
			// as an auth failure. Verify with `npm trust list <package> --otp=<code>`.
			if (/E409|409 Conflict/.test(err)) {
				log(`[exists] ${r.package} (trusted publisher already registered; verify it matches ${r.repo}/${r.workflow})`)
				already++
				wait()
				continue
			}
			log(`[failed] ${r.package}: ${err.split('\n').find((l) => /npm error/.test(l)) ?? err}`)
			failed++
			// Auth failures hit every package identically; stop rather than burn the list.
			if (/EOTP|E401|E403|Unauthorized|Forbidden/.test(err)) {
				return { ok: false, configured: ok, failed, stoppedOn: r.package, reason: 'auth' }
			}
		}
		wait() // rate limit
	}

	return { ok: failed === 0, configured: ok, alreadyConfigured: already, failed }
}
