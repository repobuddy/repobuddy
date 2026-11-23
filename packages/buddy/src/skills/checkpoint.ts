/*
 * List the checkpoints the checkpoint skill reads, newest first. Writes nothing.
 *
 *   node scripts/repobuddy.mjs checkpoint list [<repo path>] [--json]
 *
 * Inside a git repo, or given a path in one, it reads the repo's common git dir
 * (`<common dir>/repobuddy/checkpoints/`), the checkout's `.agents/repobuddy/checkpoints/`, and the
 * checkpoints in `~/.agents/repobuddy/checkpoints/` whose `repo:` names the repo (its origin
 * `owner/name`, its main checkout's folder name, or this checkout's folder name). Outside a repo it
 * reads only `~/.agents/repobuddy/checkpoints/`. A slug in more than one folder is listed once, from
 * the copy with the newest `updated` (the common dir's on a tie); the others are named as older copies.
 *
 * Each row has the title, slug, `branch` and where it is checked out (`here`, another worktree's path,
 * or not checked out), `updated`, the `## NEXT` line, `waits on <slug>` for each `depends-on` that
 * still has a checkpoint, and for a `resumed:` block its liveness: alive, dead, or unknown, worked out
 * from the recorded pid, start time and harness with `ps`. A marker in the committed file reads as
 * unknown. The marker only annotates a row; it never hides one.
 *
 * stdout: the listing, or JSON with --json. stderr: errors.
 * Exit 0 on success (also with no checkpoints), 1 when the repo path is not in a git repo, 2 on bad usage.
 */

import { formatList, listCheckpoints, NotARepoError } from '../checkpoint/list.js'

function usage(message: string): never {
	process.stderr.write(`${message}\n`)
	process.stderr.write('usage: repobuddy.mjs checkpoint list [<repo path>] [--json]\n')
	process.exit(2)
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
	const [command, ...rest] = argv
	if (command !== 'list') usage(command === undefined ? 'missing command' : `unknown command "${command}"`)
	let json = false
	let repoPath: string | undefined
	for (const a of rest) {
		if (a === '--json') json = true
		else if (a.startsWith('-')) usage(`unknown argument "${a}"`)
		else if (repoPath === undefined) repoPath = a
		else usage(`unexpected argument "${a}"`)
	}
	try {
		const list = listCheckpoints(repoPath === undefined ? {} : { repoPath })
		process.stdout.write(json ? `${JSON.stringify(list, null, 2)}\n` : formatList(list))
	} catch (error) {
		if (error instanceof NotARepoError) {
			process.stderr.write(`repobuddy.mjs checkpoint list: ${error.message}\n`)
			process.exit(1)
		}
		throw error
	}
}
