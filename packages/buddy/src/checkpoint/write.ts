import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { NotARepoError, readRepo } from './list.js'

/** Raised for a slug or checkpoint text the skill's format does not allow. */
export class InvalidCheckpointError extends Error {}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

export interface WriteOptions {
	slug: string
	/** The whole checkpoint file: front matter, then the body. */
	content: string
	/** A path in the repo to write to. Without it, the repo `cwd` is in. */
	repoPath?: string | undefined
	/** Write to `~/.agents/repobuddy/checkpoints/` instead of a repo. */
	toHome?: boolean | undefined
	/** Default `process.cwd()`. */
	cwd?: string | undefined
	/** Default `os.homedir()`. */
	home?: string | undefined
}

/** Where `writeCheckpoint` puts a checkpoint: the repo's common git dir, or the home folder outside a repo. */
export function checkpointFolder(options: Omit<WriteOptions, 'slug' | 'content'> = {}): string {
	const cwd = resolve(options.cwd ?? process.cwd())
	const homeFolder = join(options.home ?? homedir(), '.agents', 'repobuddy', 'checkpoints')
	if (options.toHome) return homeFolder
	const repo = readRepo(options.repoPath === undefined ? cwd : resolve(cwd, options.repoPath))
	if (repo) return join(repo.commonDir, 'repobuddy', 'checkpoints')
	if (options.repoPath !== undefined) throw new NotARepoError(`${options.repoPath} is not in a git repository`)
	return homeFolder
}

/** Checks the text has the front matter and the `## NEXT` and `## Not in git` sections every checkpoint needs. */
export function validateCheckpoint(content: string): void {
	const lines = content.replace(/^﻿/, '').split(/\r?\n/)
	if (lines[0]?.trim() !== '---' || !lines.some((l, i) => i > 0 && l.trim() === '---')) {
		throw new InvalidCheckpointError('the checkpoint does not start with a `---` front matter block')
	}
	for (const heading of ['NEXT', 'Not in git']) {
		if (!lines.some((l) => new RegExp(`^##\\s+${heading}\\b`).test(l))) {
			throw new InvalidCheckpointError(`the checkpoint has no \`## ${heading}\` section`)
		}
	}
}

/** Writes a checkpoint as the skill's references/save.md describes, and returns its path. */
export function writeCheckpoint(options: WriteOptions): string {
	if (!SLUG.test(options.slug)) {
		throw new InvalidCheckpointError(`"${options.slug}" is not a kebab-case slug such as flaky-login-test`)
	}
	validateCheckpoint(options.content)
	const folder = checkpointFolder(options)
	mkdirSync(folder, { recursive: true })
	const path = join(folder, `${options.slug}.md`)
	writeFileSync(path, options.content.endsWith('\n') ? options.content : `${options.content}\n`)
	return path
}

export interface MarkOptions {
	/** The checkpoint file to mark. */
	path: string
	harness: string
	session: string
	pid?: number | undefined
	/** Default `new Date()`. */
	now?: Date | undefined
	/** The start time of a process, as `ps -o lstart=` prints it; undefined when it cannot be read. */
	startOf?: ((pid: number) => string | undefined) | undefined
}

const psStart = (pid: number): string | undefined => {
	const r = spawnSync('ps', ['-o', 'lstart=', '-p', String(pid)], { encoding: 'utf8' })
	return r.status === 0 && r.stdout.trim() ? r.stdout.trim() : undefined
}

/**
 * Writes the `resumed:` block into a checkpoint's front matter, replacing an older one, as the skill's
 * references/resume.md describes. Returns the block's `at`, which `save` compares on the next pause.
 */
export function markResumed(options: MarkOptions): { path: string; at: string } {
	const path = resolve(options.path)
	if (!existsSync(path)) throw new InvalidCheckpointError(`no checkpoint at ${path}`)
	const text = readFileSync(path, 'utf8')
	validateCheckpoint(text)
	const at = (options.now ?? new Date()).toISOString().replace(/\.\d{3}Z$/, 'Z')
	const block = ['resumed:', `  at: ${at}`, `  harness: ${options.harness}`, `  session: ${options.session}`]
	if (options.pid !== undefined) {
		block.push(`  pid: ${options.pid}`)
		const started = (options.startOf ?? psStart)(options.pid)
		if (started) block.push(`  started: ${started}`)
	}
	const lines = text.replace(/^﻿/, '').split('\n')
	const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---')
	const front: string[] = []
	for (let i = 1; i < end; i++) {
		const line = lines[i] as string
		if (/^resumed:/.test(line)) {
			while (i + 1 < end && /^\s+\S/.test(lines[i + 1] as string)) i++
			continue
		}
		front.push(line)
	}
	writeFileSync(path, ['---', ...front, ...block, ...lines.slice(end)].join('\n'))
	return { path, at }
}
