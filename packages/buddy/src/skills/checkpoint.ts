/*
 * The checkpoint skill's file work: list the checkpoints, write one, and mark one resumed.
 *
 *   node scripts/repobuddy.mjs checkpoint list [<repo path>] [--json]
 *   node scripts/repobuddy.mjs checkpoint write <slug> [<repo path>] [--home] < checkpoint.md
 *   node scripts/repobuddy.mjs checkpoint mark-resumed <path> --harness <name> --session <id> [--pid <pid>]
 *
 * `list` writes nothing. Inside a git repo, or given a path in one, it reads the repo's common git dir
 * (`<common dir>/repobuddy/checkpoints/`), the checkout's `.agents/repobuddy/checkpoints/`, and the
 * checkpoints in `~/.agents/repobuddy/checkpoints/` whose `repo:` names the repo (its origin
 * `owner/name`, its main checkout's folder name, or this checkout's folder name). Outside a repo it
 * reads only `~/.agents/repobuddy/checkpoints/`. A slug in more than one folder is listed once, from
 * the copy with the newest `updated` (the common dir's on a tie); the others are named as older copies.
 * Each row has the title, slug, `branch` and where it is checked out (`here`, another worktree's path,
 * or not checked out), `updated`, the `## NEXT` line, `waits on <slug>` for each `depends-on` that
 * still has a checkpoint, and for a `resumed:` block its liveness: alive, dead, or unknown, worked out
 * from the recorded pid, start time and harness with `ps`. A marker in the committed file reads as
 * unknown. The marker only annotates a row; it never hides one.
 *
 * `write` reads the whole checkpoint file from stdin and writes it to
 * `<common dir>/repobuddy/checkpoints/<slug>.md` of the repo (the current one, or the one the path is
 * in), or to `~/.agents/repobuddy/checkpoints/<slug>.md` with `--home` or outside a repo. The file
 * tools of some harnesses refuse to write under `.git/`, so the skill writes through this command. It
 * prints the path written.
 *
 * `mark-resumed` writes the `resumed:` block (`at` now in UTC, `harness`, `session`, and with `--pid`
 * the pid and its start time from `ps`) into a checkpoint's front matter, replacing an older one, and
 * prints the `at`.
 *
 * stdout: the listing (JSON with --json), the path written, or the `at`. stderr: errors.
 * Exit 0 on success (also with no checkpoints), 1 when the repo path is not in a git repo, 2 on bad
 * usage or a checkpoint the format does not allow.
 */

import { readFileSync } from 'node:fs'
import { formatList, listCheckpoints, NotARepoError } from '../checkpoint/list.js'
import { InvalidCheckpointError, markResumed, writeCheckpoint } from '../checkpoint/write.js'

const USAGE = [
	'usage: repobuddy.mjs checkpoint list [<repo path>] [--json]',
	'       repobuddy.mjs checkpoint write <slug> [<repo path>] [--home] < checkpoint.md',
	'       repobuddy.mjs checkpoint mark-resumed <path> --harness <name> --session <id> [--pid <pid>]',
].join('\n')

function usage(message: string): never {
	process.stderr.write(`${message}\n${USAGE}\n`)
	process.exit(2)
}

function list(rest: string[]): void {
	let json = false
	let repoPath: string | undefined
	for (const a of rest) {
		if (a === '--json') json = true
		else if (a.startsWith('-')) usage(`unknown argument "${a}"`)
		else if (repoPath === undefined) repoPath = a
		else usage(`unexpected argument "${a}"`)
	}
	const result = listCheckpoints(repoPath === undefined ? {} : { repoPath })
	process.stdout.write(json ? `${JSON.stringify(result, null, 2)}\n` : formatList(result))
}

function write(rest: string[], readInput: () => string): void {
	let toHome = false
	const positional: string[] = []
	for (const a of rest) {
		if (a === '--home') toHome = true
		else if (a.startsWith('-')) usage(`unknown argument "${a}"`)
		else positional.push(a)
	}
	const [slug, repoPath, extra] = positional
	if (slug === undefined) usage('missing slug')
	if (extra !== undefined) usage(`unexpected argument "${extra}"`)
	if (toHome && repoPath !== undefined) usage('give a repo path or --home, not both')
	const path = writeCheckpoint({ slug, content: readInput(), repoPath, toHome })
	process.stdout.write(`${path}\n`)
}

function mark(rest: string[]): void {
	const flags: Record<string, string> = {}
	let path: string | undefined
	for (let i = 0; i < rest.length; i++) {
		const a = rest[i] as string
		if (a === '--harness' || a === '--session' || a === '--pid') {
			const value = rest[++i]
			if (value === undefined) usage(`missing value for ${a}`)
			flags[a.slice(2)] = value
		} else if (a.startsWith('-')) usage(`unknown argument "${a}"`)
		else if (path === undefined) path = a
		else usage(`unexpected argument "${a}"`)
	}
	if (path === undefined) usage('missing checkpoint path')
	const { harness, session } = flags
	if (!harness || !session) usage('--harness and --session are required')
	let pid: number | undefined
	if (flags['pid'] !== undefined) {
		pid = Number(flags['pid'])
		if (!Number.isInteger(pid) || pid <= 0) usage(`--pid must be a process id, not "${flags['pid']}"`)
	}
	const { at } = markResumed({ path, harness, session, pid })
	process.stdout.write(`${at}\n`)
}

export async function main(
	argv: string[] = process.argv.slice(2),
	/* istanbul ignore next -- reads the real stdin; tests inject the checkpoint text instead */
	readInput: () => string = () => readFileSync(0, 'utf8'),
): Promise<void> {
	const [command, ...rest] = argv
	try {
		if (command === 'list') list(rest)
		else if (command === 'write') write(rest, readInput)
		else if (command === 'mark-resumed') mark(rest)
		else usage(command === undefined ? 'missing command' : `unknown command "${command}"`)
	} catch (error) {
		if (error instanceof NotARepoError) {
			process.stderr.write(`repobuddy.mjs checkpoint ${command}: ${error.message}\n`)
			process.exit(1)
		}
		if (error instanceof InvalidCheckpointError) {
			process.stderr.write(`repobuddy.mjs checkpoint ${command}: ${error.message}\n`)
			process.exit(2)
		}
		throw error
	}
}
