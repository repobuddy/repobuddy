#!/usr/bin/env node
/**
 * Plans and applies npm trusted publishing (OIDC) config across one or many repos.
 *
 * plan  -- resolves scope to a package list, writes .github/npm-trust-plan.json
 * apply -- executes the plan, one `npm trust github` call per package
 *
 * stdout: JSON ack only. stderr: human-readable detail (--verbose).
 *
 * TODO: extract to packages/buddy as `buddy npm trust plan|apply` once the CLI grows a
 * command surface; the skill keeps WHEN to run it, the CLI keeps HOW.
 */

import { execFileSync, execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

const argv = process.argv.slice(2)
const mode = argv[0]
const verbose = argv.includes('--verbose')

function flag(name: string): string | undefined {
	const eq = argv.find((a) => a.startsWith(`--${name}=`))
	if (eq) return eq.slice(name.length + 3)
	const i = argv.indexOf(`--${name}`)
	return i >= 0 ? argv[i + 1] : undefined
}

function log(msg: string) {
	if (verbose) process.stderr.write(`${msg}\n`)
}

function sh(cmd: string): string {
	return execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
}

function shJson<T>(cmd: string): T | null {
	try {
		return JSON.parse(sh(cmd)) as T
	} catch {
		return null
	}
}

function ghFile(repo: string, path: string): string | null {
	try {
		const b64 = sh(`gh api repos/${repo}/contents/${path} --jq .content`)
		return Buffer.from(b64, 'base64').toString('utf8')
	} catch {
		return null
	}
}

function ghDirs(repo: string, path: string): string[] {
	const out = shJson<Array<{ name: string; type: string }>>(`gh api repos/${repo}/contents/${path}`)
	return (out ?? []).filter((e) => e.type === 'dir').map((e) => e.name)
}

const PLAN_PATH = '.github/npm-trust-plan.json'

type Row = {
	package: string
	repo: string
	workflow: string
	action: 'configure' | 'already-configured' | 'not-published' | 'private'
	note?: string
}

// --- scope resolution -------------------------------------------------------

function resolveRepos(): string[] {
	const repo = flag('repo')
	if (repo) return [repo]

	const org = flag('org')
	if (org) return listRepos(org)

	if (argv.includes('--all-orgs')) {
		const me = sh('gh api user --jq .login')
		const orgs = sh('gh api user/orgs --jq ".[].login"').split('\n').filter(Boolean)
		log(`owner: ${me}; orgs: ${orgs.join(', ') || '(none)'}`)
		return [me, ...orgs].flatMap((o) => listRepos(o))
	}

	throw new Error('scope required: --package <name> | --repo <owner/name> | --org <login> | --all-orgs')
}

function listRepos(owner: string): string[] {
	// Source repos only. Forks are someone else's to publish.
	const names = sh(
		`gh repo list ${owner} --source --no-archived --limit 500 --json nameWithOwner --jq ".[].nameWithOwner"`,
	)
	return names ? names.split('\n').filter(Boolean) : []
}

// --- package derivation -----------------------------------------------------

/** npm trust config is per PACKAGE NAME, not per repo, so monorepos yield many rows. */
function derivePackages(repo: string): Array<{ name: string }> {
	const rootRaw = ghFile(repo, 'package.json')
	if (!rootRaw) return []

	let root: any
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
			? root.workspaces.packages
			: parsePnpmWorkspace(repo)

	const dirs = new Set<string>()
	for (const g of globs) {
		const m = /^([^*]+)\/\*$/.exec(g)
		if (m) for (const d of ghDirs(repo, m[1])) dirs.add(`${m[1]}/${d}`)
		else if (!g.includes('*')) dirs.add(g)
	}
	if (dirs.size === 0) for (const d of ghDirs(repo, '')) dirs.add(d)

	const out: Array<{ name: string }> = []
	for (const d of dirs) {
		if (d.startsWith('.')) continue
		const raw = ghFile(repo, `${d}/package.json`)
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

function parsePnpmWorkspace(repo: string): string[] {
	const raw = ghFile(repo, 'pnpm-workspace.yaml')
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
			if (m) globs.push(m[1])
			else if (/^\S/.test(line)) inPackages = false
		}
	}
	return globs
}

/**
 * npm validates the CALLER workflow, not the reusable one it delegates to.
 * A workflow qualifies only if it both triggers on push to the default branch AND
 * actually publishes; scoring then prefers one named `release`.
 */
function detectCallerWorkflow(repo: string): { workflow: string; confident: boolean } {
	const files = shJson<Array<{ name: string }>>(`gh api repos/${repo}/contents/.github/workflows`) ?? []
	const names = files.map((f) => f.name).filter((n) => /\.ya?ml$/.test(n))

	const scored: Array<{ name: string; score: number }> = []
	for (const n of names) {
		const body = ghFile(repo, `.github/workflows/${n}`) ?? ''
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

	if (scored.length > 0) return { workflow: scored[0].name, confident: scored.length === 1 || scored[0].score > 0 }
	// Nothing matched: fall back, but say so rather than assert a guess.
	return { workflow: names.includes('release.yml') ? 'release.yml' : (names[0] ?? 'release.yml'), confident: false }
}

function isPublished(pkg: string): boolean {
	try {
		sh(`npm view ${pkg} version`)
		return true
	} catch {
		return false
	}
}

// --- plan -------------------------------------------------------------------

function doPlan() {
	const single = flag('package')
	const rows: Row[] = []

	if (single) {
		const repo = flag('repo')
		if (!repo) throw new Error('--package requires --repo <owner/name>')
		const override = flag('file')
		const det = override ? { workflow: override, confident: true } : detectCallerWorkflow(repo)
		rows.push({
			package: single,
			repo,
			workflow: det.workflow,
			action: isPublished(single) ? 'configure' : 'not-published',
			...(det.confident ? {} : { note: 'workflow guessed - confirm before applying' }),
		})
	} else {
		for (const repo of resolveRepos()) {
			log(`scanning ${repo}`)
			const pkgs = derivePackages(repo)
			if (pkgs.length === 0) {
				rows.push({ package: '-', repo, workflow: '-', action: 'private', note: 'nothing published' })
				continue
			}
			const det = detectCallerWorkflow(repo)
			for (const p of pkgs) {
				rows.push({
					package: p.name,
					repo,
					workflow: det.workflow,
					action: isPublished(p.name) ? 'configure' : 'not-published',
					...(det.confident ? {} : { note: 'workflow guessed - confirm before applying' }),
				})
			}
		}
	}

	mkdirSync(dirname(PLAN_PATH), { recursive: true })
	writeFileSync(PLAN_PATH, `${JSON.stringify({ generated: true, rows }, null, 2)}\n`)

	if (verbose) {
		for (const r of rows) process.stderr.write(`${r.action.padEnd(18)} ${r.package} <- ${r.repo}/${r.workflow}\n`)
	}

	const counts = rows.reduce<Record<string, number>>((a, r) => ((a[r.action] = (a[r.action] ?? 0) + 1), a), {})
	process.stdout.write(`${JSON.stringify({ ok: true, plan: PLAN_PATH, total: rows.length, counts })}\n`)
}

// --- apply ------------------------------------------------------------------

function doApply() {
	if (!existsSync(PLAN_PATH)) throw new Error(`no plan at ${PLAN_PATH}; run plan first`)
	const otp = flag('otp')
	if (!otp) throw new Error('--otp=<code> required; npm enforces 2FA on trust operations')

	const plan = JSON.parse(readFileSync(PLAN_PATH, 'utf8')) as { rows: Row[] }
	const todo = plan.rows.filter((r) => r.action === 'configure')

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
			execFileSync('npm', args, { stdio: ['ignore', 'ignore', 'pipe'] })
			log(`OK      ${r.package}`)
			ok++
		} catch (e: any) {
			const err = String(e.stderr ?? e.message ?? '')
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
				log(`EXISTS  ${r.package} (trusted publisher already registered; verify it matches ${r.repo}/${r.workflow})`)
				already++
				Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000)
				continue
			}
			process.stderr.write(`FAILED  ${r.package}: ${err.split('\n').find((l) => /npm error/.test(l)) ?? err}\n`)
			failed++
			// Auth failures hit every package identically; stop rather than burn the list.
			if (/EOTP|E401|E403|Unauthorized|Forbidden/.test(err)) {
				process.stdout.write(
					`${JSON.stringify({ ok: false, configured: ok, failed, stoppedOn: r.package, reason: 'auth' })}\n`,
				)
				process.exit(1)
			}
		}
		Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000) // rate limit
	}

	process.stdout.write(`${JSON.stringify({ ok: failed === 0, configured: ok, alreadyConfigured: already, failed })}\n`)
}

try {
	if (mode === 'plan') doPlan()
	else if (mode === 'apply') doApply()
	else {
		process.stderr.write(
			'usage: npm-trust.mts plan|apply [--package|--repo|--org|--all-orgs] [--otp=code] [--verbose]\n',
		)
		process.exit(2)
	}
} catch (e: any) {
	process.stdout.write(`${JSON.stringify({ ok: false, error: String(e.message ?? e) })}\n`)
	process.exit(1)
}
