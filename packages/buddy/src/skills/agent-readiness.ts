/*
 * Score how ready a repository is for coding agents to work in, from static checks alone.
 *
 *   node scripts/agent-readiness.mjs score [--dir <repo>] [--json]
 *   node scripts/agent-readiness.mjs score --package <path> [--json]
 *
 * Reports the gated level (1-4), a score per area, the top three fixes, and the tokens every agent
 * session loads before it starts (instruction files plus installed skill descriptions, estimated at
 * four characters per token). Nothing is built, installed, or run; nothing is written.
 *
 * Checks with status `judge` are ones a script cannot decide (does CI run the same command, is the
 * instructions file accurate). The agent running the skill settles them; a failed judgment can only
 * lower the level.
 *
 * With --package, it scores the consuming side instead: how cheaply another repo's agent can use the
 * package through what ships (declarations, exports map, README, changelog, llms.txt), with the same
 * gated report shape. Public surface size and a shipped agent skill are reported, not scored.
 *
 * stdout: a human report, or JSON with --json. stderr: errors.
 * Exit 0 on success, 2 on bad usage.
 */

import { resolve } from 'node:path'
import { collectFacts } from '../agent-readiness/facts.js'
import { collectPackageFacts } from '../agent-readiness/package-facts.js'
import { formatPackageReport, scorePackage } from '../agent-readiness/package-score.js'
import { formatReport, score } from '../agent-readiness/score.js'

const USAGE = 'usage: agent-readiness.mjs score [--dir <repo> | --package <path>] [--json]'

function usage(message: string): never {
	process.stderr.write(`${message}\n${USAGE}\n`)
	process.exit(2)
}

interface Opts {
	dir: string
	package: string | undefined
	json: boolean
}

function parseArgs(argv: string[]): Opts {
	const [command, ...rest] = argv
	if (command !== 'score') usage(command === undefined ? 'missing command' : `unknown command "${command}"`)
	const opts: Opts = { dir: process.cwd(), package: undefined, json: false }
	let hasDir = false
	for (let i = 0; i < rest.length; i++) {
		const a = rest[i] as string
		if (a === '--dir') {
			const value = rest[i + 1]
			if (value === undefined) usage('--dir needs a value')
			opts.dir = resolve(value)
			hasDir = true
			i++
		} else if (a === '--package') {
			const value = rest[i + 1]
			if (value === undefined) usage('--package needs a value')
			opts.package = resolve(value)
			i++
		} else if (a === '--json') opts.json = true
		else usage(`unknown argument "${a}"`)
	}
	if (hasDir && opts.package !== undefined) usage('--dir and --package score different things; pass one')
	return opts
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
	const opts = parseArgs(argv)
	if (opts.package !== undefined) {
		const result = scorePackage(collectPackageFacts(opts.package))
		process.stdout.write(opts.json ? `${JSON.stringify(result, null, 2)}\n` : formatPackageReport(result))
		return
	}
	const result = score(collectFacts(opts.dir))
	process.stdout.write(opts.json ? `${JSON.stringify(result, null, 2)}\n` : formatReport(result))
}

// Resolve the entry check against the built bundle's filename, since this module runs as
// `skills/agent-readiness/scripts/agent-readiness.mjs`, not under its source name.
/* istanbul ignore next -- process.argv entrypoint guard, exercised only when the bundle runs as a child process */
if (process.argv[1]?.endsWith('agent-readiness.mjs')) await main()
