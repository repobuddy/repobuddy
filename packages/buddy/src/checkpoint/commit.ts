import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { homedir, hostname, userInfo } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { NotARepoError, readRepo } from './list.js'
import { InvalidCheckpointError } from './write.js'

/** Raised when a checkpoint copy holds a path or name that would leak once committed. */
export class RedactionError extends Error {
	constructor(readonly hits: string[]) {
		super(`the checkpoints hold what a commit would leak; rewrite them and commit again:\n${hits.join('\n')}`)
	}
}

export interface CommitOptions {
	/** The checkpoints to copy from the common git dir and commit. */
	slugs: string[]
	/** The committed copies to delete in the same commit. */
	drops?: string[] | undefined
	/** Words a hit may be, such as a username that is also a common word. */
	allow?: string[] | undefined
	/** The checkout to commit in. */
	cwd: string
	/** Default the current home folder, user name and host name. */
	identity?: { home: string; user: string; host: string } | undefined
}

export interface CommitResult {
	commit: string
	message: string
	paths: string[]
}

/** Runs git in `root` and returns its stdout; throws with git's output when it fails. */
function git(root: string, args: string[]): string {
	const r = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' })
	if (r.status !== 0) throw new Error(`git ${args[0]} failed: ${`${r.stdout}${r.stderr}`.trim()}`)
	return r.stdout.trim()
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The lines of `text` that hold an absolute path, the home folder, the user name or the host name. */
export function redactionHits(
	file: string,
	text: string,
	identity: { home: string; user: string; host: string },
	allow: string[] = [],
): string[] {
	const patterns = [/\/(home|Users)\//, /\b[A-Za-z]:\\/]
	if (identity.home) patterns.push(new RegExp(escapeRegExp(identity.home)))
	for (const word of [identity.user, identity.host]) {
		if (word && !allow.includes(word)) patterns.push(new RegExp(`\\b${escapeRegExp(word)}\\b`))
	}
	const hits: string[] = []
	text.split('\n').forEach((line, i) => {
		if (patterns.some((p) => p.test(line))) hits.push(`${file}:${i + 1}: ${line.trim()}`)
	})
	return hits
}

/**
 * Commits copies of checkpoints, as step 9 of the skill's references/save.md describes: copies each
 * from the common git dir to `.agents/repobuddy/checkpoints/<slug>.md` in the checkout, checks the
 * copies for paths and names a commit would leak, force-adds them (the folder may be excluded), and
 * commits only those paths, with the drops, as `docs: checkpoint <slugs>` or `docs: drop checkpoint <slugs>`.
 */
export function commitCheckpoints(options: CommitOptions): CommitResult {
	const cwd = resolve(options.cwd)
	const repo = readRepo(cwd)
	if (!repo) throw new NotARepoError(`${cwd} is not in a git repository`)
	const drops = options.drops ?? []
	if (options.slugs.length === 0 && drops.length === 0)
		throw new InvalidCheckpointError('name a checkpoint to commit or drop')
	const identity = options.identity ?? { home: homedir(), user: userInfo().username, host: hostname() }
	const from = join(repo.commonDir, 'repobuddy', 'checkpoints')
	const to = join(repo.root, '.agents', 'repobuddy', 'checkpoints')

	const hits: string[] = []
	for (const slug of options.slugs) {
		const source = join(from, `${slug}.md`)
		if (!existsSync(source)) throw new InvalidCheckpointError(`no checkpoint ${slug} in ${from}`)
		hits.push(...redactionHits(`${slug}.md`, readFileSync(source, 'utf8'), identity, options.allow))
	}
	if (hits.length > 0) throw new RedactionError(hits)

	mkdirSync(to, { recursive: true })
	const paths: string[] = []
	for (const slug of options.slugs) {
		const target = join(to, `${slug}.md`)
		copyFileSync(join(from, `${slug}.md`), target)
		paths.push(relative(repo.root, target))
	}
	if (paths.length > 0) git(repo.root, ['add', '-f', '--', ...paths])
	for (const slug of drops) {
		const path = relative(repo.root, join(to, `${slug}.md`))
		git(repo.root, ['rm', '-q', '--ignore-unmatch', '--', path])
		if (git(repo.root, ['ls-tree', '--name-only', 'HEAD', '--', path])) paths.push(path)
	}
	if (paths.length === 0) throw new InvalidCheckpointError('none of the dropped checkpoints is committed')

	const message =
		options.slugs.length > 0
			? `docs: checkpoint ${options.slugs.join(', ')}`
			: `docs: drop checkpoint ${drops.join(', ')}`
	git(repo.root, ['commit', '-q', '-m', message, '--only', '--', ...paths])
	return { commit: git(repo.root, ['rev-parse', '--short', 'HEAD']), message, paths }
}
