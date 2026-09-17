/*
 * Detects current GitHub repo settings and filesystem signals.
 * Writes the state artifact to a temp path (override with --out <path>) and prints a
 * JSON ack to stdout carrying that path. Human-readable table on stderr with --verbose.
 *
 *   node scripts/detect-state.mjs [--dir <repo>] [--out <path>] [--verbose]
 *
 * stdout: JSON ack. stderr: human-readable table with --verbose. Exit 0 on success, 1 on bad usage.
 */

import { detectState } from '../setup-github-repo/detect-state.js'

function usage(message: string): never {
	process.stderr.write(`${message}\n`)
	process.stderr.write('usage: detect-state.mjs [--dir <repo>] [--out <path>] [--verbose]\n')
	process.exit(1)
}

interface Opts {
	dir?: string
	out?: string
	verbose?: boolean
}

function parseArgs(argv: string[]): Opts {
	const opts: Opts = {}
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i] as string
		if (a === '--dir' || a === '--out') {
			const value = argv[i + 1]
			if (value === undefined) usage(`${a} needs a value`)
			if (a === '--dir') opts.dir = value
			else opts.out = value
			i++
		} else if (a === '--verbose') opts.verbose = true
		else usage(`unknown argument "${a}"`)
	}
	return opts
}

function printVerbose(result: ReturnType<typeof detectState>): void {
	const { state } = result
	const { rows, detected } = state

	const colWidths = [
		Math.max(...rows.map((r) => r.setting.length), 'Setting'.length),
		Math.max(...rows.map((r) => r.current.length), 'Current'.length),
		Math.max(...rows.map((r) => r.target.length), 'Target'.length),
		Math.max(...rows.map((r) => r.action.length), 'Action'.length),
	] as [number, number, number, number]

	function pad(s: string, n: number) {
		return s.padEnd(n)
	}
	function formatRow(cols: string[]) {
		return `| ${cols.map((c, i) => pad(c, colWidths[i] ?? 0)).join(' | ')} |`
	}
	function divider() {
		return `|-${colWidths.map((w) => '-'.repeat(w)).join('-|-')}-|`
	}

	function warn(line: string) {
		process.stderr.write(`${line}\n`)
	}

	warn(`\nRepo: ${state.repo}  (default branch: ${state.defaultBranch})\n`)
	warn(formatRow(['Setting', 'Current', 'Target', 'Action']))
	warn(divider())
	for (const r of rows) warn(formatRow([r.setting, r.current, r.target, r.action]))

	warn('\nDetected:')
	warn(`  Language:        ${detected.language ?? 'unknown'}`)
	warn(`  CodeQL language: ${detected.codeqlLanguage ?? 'unknown'}`)
	warn(`  Package manager: ${detected.packageManager ?? 'none'}`)
	warn(
		`  Existing workflows: ${detected.existingWorkflows.length > 0 ? detected.existingWorkflows.join(', ') : 'none'}`,
	)
	warn(`\nState written to ${result.ack.artifact}`)
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
	const opts = parseArgs(argv)
	let result: ReturnType<typeof detectState>
	try {
		const options: Parameters<typeof detectState>[0] = {}
		if (opts.dir !== undefined) options.dir = opts.dir
		if (opts.out !== undefined) options.out = opts.out
		result = detectState(options)
	} catch (error) {
		process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`)
		process.exit(1)
	}
	process.stdout.write(`${JSON.stringify(result.ack)}\n`)
	if (opts.verbose) printVerbose(result)
}

// Resolve the entry check against the built bundle's filename, since this module runs as
// `skills/setup-github-repo/scripts/detect-state.mjs`, not under its source name.
/* istanbul ignore next -- process.argv entrypoint guard, exercised only when the bundle runs as a child process */
if (process.argv[1]?.endsWith('detect-state.mjs')) await main()
