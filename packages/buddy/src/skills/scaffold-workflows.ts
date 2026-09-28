/*
 * Scaffolds GitHub Actions workflow files based on detected repo state.
 * Reads the state artifact produced by detect-state.mjs. Defaults to the same temp path
 * detect-state writes to; pass --state to point at another one.
 * Skips files that already exist.
 *
 *   node scripts/scaffold-workflows.mjs [--state <path>] [--dir <repo>] [--workflows pull-request,release,dependabot-automerge,codeql] [--yes] [--verbose]
 *
 * stdout: JSON ack. stderr: progress with --verbose, an interactive prompt without --yes.
 * Exit 0 on success (including a user-declined prompt), 1 when the state file is missing or usage is bad.
 */

import { scaffoldWorkflows } from '../setup-github-repo/scaffold-workflows.js'

function usage(message: string): never {
	process.stderr.write(`${message}\n`)
	process.stderr.write(
		'usage: scaffold-workflows.mjs [--state <path>] [--dir <repo>] [--workflows <list>] [--yes] [--verbose]\n',
	)
	process.exit(1)
}

interface Opts {
	state?: string
	dir?: string
	workflows?: string
	yes?: boolean
	verbose?: boolean
}

function parseArgs(argv: string[]): Opts {
	const opts: Opts = {}
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i] as string
		if (a === '--state' || a === '--dir' || a === '--workflows') {
			const value = argv[i + 1]
			if (value === undefined) usage(`${a} needs a value`)
			if (a === '--state') opts.state = value
			else if (a === '--dir') opts.dir = value
			else opts.workflows = value
			i++
		} else if (a === '--yes' || a === '-y') opts.yes = true
		else if (a === '--verbose') opts.verbose = true
		else usage(`unknown argument "${a}"`)
	}
	return opts
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
	const opts = parseArgs(argv)
	try {
		const options: Parameters<typeof scaffoldWorkflows>[0] = {}
		if (opts.state !== undefined) options.statePath = opts.state
		if (opts.dir !== undefined) options.dir = opts.dir
		if (opts.workflows !== undefined) options.workflows = opts.workflows
		if (opts.yes !== undefined) options.yes = opts.yes
		if (opts.verbose) options.log = (message) => console.warn(message)
		const result = await scaffoldWorkflows(options)
		process.stdout.write(`${JSON.stringify(result)}\n`)
	} catch (error) {
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
		process.exit(1)
	}
}

// Resolve the entry check against the built bundle's filename, since this module runs as
// `skills/setup-github-repo/scripts/scaffold-workflows.mjs`, not under its source name.
/* istanbul ignore next -- process.argv entrypoint guard, exercised only when the bundle runs as a child process */
if (process.argv[1]?.endsWith('scaffold-workflows.mjs')) await main()
