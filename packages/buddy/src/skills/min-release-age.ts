/*
 * Read and edit a repository's minimum-release-age exemptions.
 *
 *   node scripts/min-release-age.mjs status  [--dir <repo>] [--json] [--check]
 *   node scripts/min-release-age.mjs lift    <pkg[@version|@tag]> [--dir <repo>] [--pm <pm>] [--check] [--name-wide] [--until <ISO>] [--json]
 *   node scripts/min-release-age.mjs restore [--dir <repo>] [--now <ISO>] [--dry-run] [--json] [--github-output] [--body-file <path>]
 *
 * `status` also reports the git host (from the origin remote), the CI systems found in the repo, and
 * which provider `setup-ci` should target and
 * the reference to load for it. --check exits 1 when any lift has expired.
 *
 * `restore` exits 0 whether or not it removed anything; read `removed` from --json or --github-output.
 * --body-file writes the change-request description for CI jobs that open one.
 *
 *   node scripts/min-release-age.mjs open-pr --provider bitbucket|azure|forgejo|gitea --body-file <path> [--branch <b>]
 *
 * `open-pr` runs inside a CI job and opens or updates the restore pull request through the provider's
 * REST API, reading the repository and token from the job's environment. It prints JSON.
 *
 * Supports pnpm (pnpm-workspace.yaml), Yarn Berry (.yarnrc.yml), npm (.npmrc) and bun (bunfig.toml).
 *
 * Every exemption this script adds is two lines: a marker comment, then the entry.
 *
 *   # min-release-age: lift <pkg@version> until <ISO>
 *   - '<pkg@version>'
 *
 * `restore` deletes the marker and its entry once `until` has passed. Entries without a marker are
 * permanent policy and are never touched.
 *
 * `lift` takes `pkg` (latest), `pkg@tag`, or `pkg@x.y.z` and always writes the exact version.
 * It sets `until` to the version's publish time plus the configured window: past that moment the
 * version clears the gate on its own and the exemption does nothing. pnpm and Yarn exempt the single
 * version; npm and bun can only exempt the whole package name, which `lift` refuses without
 * `--name-wide`.
 *
 * stdout: a human summary, or JSON with --json. stderr: errors.
 * Exit 0 on success, 1 on a failed lift or restore, 2 on bad usage.
 */

import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { type LiftOptions, lift, type RestoreOptions, restore, status } from '../release-age/core.js'
import { detectManager, isPackageManager, type PackageManager } from '../release-age/managers.js'
import { openPr } from '../release-age/open-pr.js'

function usage(message: string): never {
	process.stderr.write(`${message}\n`)
	process.stderr.write(
		'usage: min-release-age.mjs <status|lift <pkg[@version|@tag]>|restore|open-pr> [--dir <repo>] [--pm <pm>] [--name-wide] [--until <ISO>] [--now <ISO>] [--dry-run] [--json] [--github-output] [--body-file <path>] [--provider <p>] [--branch <b>]\n',
	)
	process.exit(2)
}

interface Opts {
	positional: string[]
	dir?: string
	pm?: string
	until?: string
	now?: string
	'body-file'?: string
	provider?: string
	branch?: string
	json?: boolean
	check?: boolean
	'name-wide'?: boolean
	'dry-run'?: boolean
	'github-output'?: boolean
}

const VALUED = new Set(['--dir', '--pm', '--until', '--now', '--body-file', '--provider', '--branch'])

function parseArgs(argv: string[]): Opts {
	const opts: Opts = { positional: [] }
	const record = opts as unknown as Record<string, string | boolean | string[]>
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i] as string
		if (VALUED.has(a)) {
			const value = argv[i + 1]
			if (value === undefined) usage(`${a} needs a value`)
			record[a.slice(2)] = value
			i++
		} else if (a.startsWith('--')) record[a.slice(2)] = true
		else opts.positional.push(a)
	}
	return opts
}

function printStatus(s: Awaited<ReturnType<typeof status>>): void {
	const lines = [
		`package manager: ${s.packageManager} (${s.file})`,
		`gate: ${s.setting} = ${s.value ?? `unset — ${s.defaultNote}`}${s.minutes != null ? ` (${s.minutes} minutes)` : ''}`,
		`exemptions: ${s.versionPin ? 'single version' : 'whole package name only'}`,
		`permanent: ${s.permanent.length ? s.permanent.join(', ') : 'none'}`,
		`lifts: ${s.lifts.length ? '' : 'none'}`,
		...s.lifts.map((l) => `  ${l.value} until ${l.until}${l.expired ? ' — EXPIRED' : ''}`),
		`git host: ${s.ci.host}${s.ci.remote ? ` (${s.ci.remote})` : ''}`,
		`ci systems: ${s.ci.systems.length ? s.ci.systems.join(', ') : 'none found'}`,
		`cleanup job: ${s.ci.installed ? `installed (${s.ci.provider}, ${s.ci.job})` : `not installed — setup-ci would target ${s.ci.provider}`}`,
	]
	process.stdout.write(`${lines.join('\n')}\n`)
}

function restoreBody(result: { removed: { lift: string; until: string }[] }): string {
	return [
		'Removes minimum-release-age lifts whose window has passed. Each version now clears the gate on its own.',
		'',
		...result.removed.map((r) => `- \`${r.lift}\` (expired ${r.until})`),
	].join('\n')
}

function writeGithubOutput(result: { removed: { lift: string; until: string }[] }): void {
	const target = process.env['GITHUB_OUTPUT']
	if (!target) return
	appendFileSync(target, `removed=${result.removed.length}\nbody<<__MRA__\n${restoreBody(result)}\n__MRA__\n`)
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
	const opts = parseArgs(argv)
	const [command, spec] = opts.positional
	const dir = resolve(opts.dir ?? process.cwd())
	if (!command || !['status', 'lift', 'restore', 'open-pr'].includes(command))
		usage(`unknown command "${command ?? ''}"`)
	if (command === 'open-pr') {
		if (typeof opts.provider !== 'string' || typeof opts['body-file'] !== 'string') {
			usage('open-pr needs --provider and --body-file')
		}
		const branch = typeof opts.branch === 'string' ? opts.branch : 'chore/min-release-age-restore'
		const body = readFileSync(opts['body-file'] as string, 'utf8')
		const result = await openPr(opts.provider as string, { branch, body })
		if (!result.ok) {
			process.stderr.write(`${result.error}\n`)
			process.exit(1)
		}
		process.stdout.write(`${JSON.stringify(result)}\n`)
		return
	}
	const pmName = opts.pm ?? detectManager(dir)
	if (!pmName || !isPackageManager(pmName))
		usage(`cannot detect the package manager in ${dir}; pass --pm pnpm|yarn|npm|bun`)
	const pm: PackageManager = pmName
	const now = opts.now ? new Date(opts.now) : new Date()

	if (command === 'status') {
		const result = status(dir, pm, now)
		if (opts.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
		else printStatus(result)
		if (opts.check && result.lifts.some((l) => l.expired)) process.exit(1)
		return
	}

	let result: Awaited<ReturnType<typeof lift>> | Awaited<ReturnType<typeof restore>>
	if (command === 'lift') {
		if (!spec) usage('lift needs <pkg[@version|@tag]>')
		const liftOptions: LiftOptions = { nameWide: Boolean(opts['name-wide']), now }
		if (opts.until !== undefined) liftOptions.until = opts.until
		try {
			result = lift(dir, pm, spec, liftOptions)
		} catch (error) {
			result = { ok: false, error: error instanceof Error ? error.message : String(error) }
		}
	} else {
		const restoreOptions: RestoreOptions = { now, dryRun: Boolean(opts['dry-run']) }
		result = restore(dir, pm, restoreOptions)
		if (result.ok && opts['github-output']) writeGithubOutput(result)
		if (result.ok && typeof opts['body-file'] === 'string') writeFileSync(opts['body-file'], `${restoreBody(result)}\n`)
	}

	if (!result.ok) {
		process.stderr.write(`${result.error}\n`)
		if (opts.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
		process.exit(1)
	}
	if (opts.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
	else if ('changed' in result) {
		process.stdout.write(
			result.changed
				? `lifted ${result.spec}${result.tag ? ` (${result.tag})` : ''} as '${result.entry}' in ${result.file} until ${result.until}${result.nameWide ? ' (whole package name)' : ''}\n`
				: `no change: ${result.reason}\n`,
		)
	} else if ('removed' in result) {
		const verb = result.dryRun ? 'would remove' : 'removed'
		process.stdout.write(
			`${verb} ${result.removed.length} expired lift(s)${result.removed.map((r) => `\n  ${r.lift} (until ${r.until})`).join('')}\n` +
				`${result.kept.length} active lift(s) kept\n`,
		)
	}
}

// Resolve the entry check against the built bundle's filename, since this module runs as
// `skills/min-release-age/scripts/min-release-age.mjs`, not under its source name.
// This process-boundary guard only fires when the bundle is invoked directly as a script (verified
// by src/skills/bundles.spec.ts, which spawns the built bundle as a child process); it cannot be
// exercised in-process without changing what "running under jest" means, so it is excluded narrowly.
/* istanbul ignore next -- process.argv entrypoint guard, covered by bundles.spec.ts (child process) */
if (process.argv[1]?.endsWith('min-release-age.mjs')) await main()
