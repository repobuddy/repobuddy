/*
 * Plans and applies npm trusted publishing (OIDC) config across one or many repos.
 *
 *   node scripts/npm-trust.mjs plan  [--package <name> --repo <owner/name> | --repo <owner/name> | --org <login> | --all-orgs] [--file <workflow>] [--dir <repo>] [--verbose]
 *   node scripts/npm-trust.mjs apply [--otp=<code>] [--dir <repo>] [--verbose]
 *
 * `plan` resolves scope to a package list and writes `.github/npm-trust-plan.json`.
 * `apply` executes the plan, one `npm trust github` call per package.
 *
 * stdout: JSON ack only. stderr: human-readable detail (--verbose).
 * Exit 0 on success, 1 on a failed plan/apply, 2 on bad usage.
 */

import { apply, plan } from '../npm-trust/core.js'

function flag(argv: string[], name: string): string | undefined {
	const eq = argv.find((a) => a.startsWith(`--${name}=`))
	if (eq) return eq.slice(name.length + 3)
	const i = argv.indexOf(`--${name}`)
	return i >= 0 ? argv[i + 1] : undefined
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
	const mode = argv[0]
	const verbose = argv.includes('--verbose')
	const log = (msg: string) => {
		if (verbose) process.stderr.write(`${msg}\n`)
	}

	try {
		if (mode === 'plan') {
			const result = plan(
				{
					package: flag(argv, 'package'),
					repo: flag(argv, 'repo'),
					org: flag(argv, 'org'),
					allOrgs: argv.includes('--all-orgs'),
					file: flag(argv, 'file'),
					dir: flag(argv, 'dir'),
				},
				{ log },
			)
			process.stdout.write(
				`${JSON.stringify({ ok: result.ok, plan: result.plan, total: result.total, counts: result.counts })}\n`,
			)
		} else if (mode === 'apply') {
			const result = apply({ otp: flag(argv, 'otp'), dir: flag(argv, 'dir') }, { log })
			process.stdout.write(`${JSON.stringify(result)}\n`)
			if (!result.ok) process.exit(1)
		} else {
			process.stderr.write(
				'usage: npm-trust.mjs plan|apply [--package|--repo|--org|--all-orgs] [--otp=code] [--verbose]\n',
			)
			process.exit(2)
		}
	} catch (e) {
		process.stdout.write(`${JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) })}\n`)
		process.exit(1)
	}
}

// Resolve the entry check against the built bundle's filename, since this module runs as
// `skills/setup-npm-trusted-publishing/scripts/npm-trust.mjs`, not under its source name.
/* istanbul ignore next -- process.argv entrypoint guard, exercised only when the bundle runs as a child process */
if (process.argv[1]?.endsWith('npm-trust.mjs')) await main()
