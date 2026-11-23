import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join, relative, resolve } from 'node:path'

/** Where a checkpoint copy was found. The order is the tie-break order for a slug in two folders. */
type CheckpointFolder = 'common' | 'checkout' | 'home'
const FOLDER_RANK: Record<CheckpointFolder, number> = { common: 0, checkout: 1, home: 2 }

export interface ResumedMarker {
	at?: string | undefined
	harness?: string | undefined
	session?: string | undefined
	pid?: string | undefined
	started?: string | undefined
}

/** The **Resume marker** answer from the checkpoint skill's references/resume.md. */
export interface Liveness {
	state: 'alive' | 'dead' | 'unknown'
	/** Why the state is not `alive`, in a few words. */
	reason?: string | undefined
	session?: string | undefined
	/** `resumed.at`, as given. */
	at?: string | undefined
	/** How long ago `resumed.at` was, such as `3h` or `2d`; absent when `at` does not parse. */
	age?: string | undefined
}

interface CheckpointRow {
	slug: string
	title: string
	path: string
	folder: CheckpointFolder
	repo?: string | undefined
	branch?: string | undefined
	/** `here`, the path of the worktree that has `branch` checked out, or `null` when none does. Absent for branch `none` or outside a repo. */
	checkedOut?: string | null | undefined
	updated?: string | undefined
	next?: string | undefined
	dependsOn: string[]
	/** The `depends-on` slugs that still have a checkpoint. */
	waitsOn: string[]
	liveness?: Liveness | undefined
	/** The other copies of this slug, which are older (or lost the tie). */
	olderCopies: Array<{ path: string; folder: CheckpointFolder; updated?: string | undefined }>
}

interface RepoInfo {
	/** The checkout the listing is for: the given repo path's, or the current one. */
	root: string
	commonDir: string
	/** `owner/name` from the origin remote. */
	origin?: string | undefined
	/** The folder name of the main checkout. */
	mainName: string
}

export interface CheckpointList {
	repo: RepoInfo | null
	folders: Array<{ folder: CheckpointFolder; path: string }>
	checkpoints: CheckpointRow[]
}

export type ProcessProbe = (pid: number) => { comm: string; started: string } | 'gone' | 'error'

export interface ListOptions {
	/** A path inside the repo to list. Without it, the repo `cwd` is in, or the home folder outside one. */
	repoPath?: string | undefined
	/** Default `process.cwd()`. */
	cwd?: string | undefined
	/** Default `os.homedir()`. */
	home?: string | undefined
	/** Default `new Date()`. */
	now?: Date | undefined
	/** Default reads `ps`. */
	probe?: ProcessProbe | undefined
}

export class NotARepoError extends Error {}

/** The process name each harness runs as, from the harness references of the checkpoint skill. */
const HARNESS_PROCESS: Record<string, string> = { 'claude-code': 'claude' }

function git(dir: string, args: string[]): string | null {
	const r = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' })
	return r.status === 0 ? r.stdout.trim() : null
}

function readRepo(dir: string): RepoInfo | null {
	const root = git(dir, ['rev-parse', '--show-toplevel'])
	const commonDir = git(dir, ['rev-parse', '--path-format=absolute', '--git-common-dir'])
	if (!root || !commonDir) return null
	const url = git(dir, ['remote', 'get-url', 'origin'])
	const origin = url ? originName(url) : undefined
	const main = worktrees(dir)[0]?.path ?? root
	return { root: resolve(root), commonDir: resolve(commonDir), origin, mainName: basename(main) }
}

/** `owner/name` from a remote URL: the last two path segments, without `.git`. */
export function originName(url: string): string | undefined {
	const path = url
		.trim()
		.replace(/\.git\/?$/, '')
		.replace(/^[a-z+]+:\/\/[^/]+\//i, '')
		.replace(/^[^@/]+@[^:]+:/, '')
	const parts = path.split('/').filter(Boolean)
	return parts.length >= 2 ? parts.slice(-2).join('/') : undefined
}

function worktrees(dir: string): Array<{ path: string; branch?: string }> {
	const out = git(dir, ['worktree', 'list', '--porcelain'])
	if (!out) return []
	const list: Array<{ path: string; branch?: string }> = []
	for (const line of out.split('\n')) {
		if (line.startsWith('worktree ')) list.push({ path: resolve(line.slice('worktree '.length)) })
		else if (line.startsWith('branch refs/heads/') && list.length > 0) {
			;(list[list.length - 1] as { branch?: string }).branch = line.slice('branch refs/heads/'.length)
		}
	}
	return list
}

export interface ParsedCheckpoint {
	fields: Record<string, string>
	dependsOn: string[]
	resumed?: ResumedMarker | undefined
	title?: string | undefined
	next?: string | undefined
}

function unquote(value: string): string {
	const v = value.replace(/\s+#.*$/, '').trim()
	return /^(['"]).*\1$/.test(v) ? v.slice(1, -1) : v
}

/** Reads the front matter fields, the title and the `## NEXT` line of a checkpoint file. */
export function parseCheckpoint(text: string): ParsedCheckpoint {
	const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/)
	const fields: Record<string, string> = {}
	const dependsOn: string[] = []
	let resumed: ResumedMarker | undefined
	let body = 0
	if (lines[0]?.trim() === '---') {
		const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---')
		body = end === -1 ? lines.length : end + 1
		let block: string | undefined
		for (const line of lines.slice(1, end === -1 ? lines.length : end)) {
			if (!line.trim() || line.trim().startsWith('#')) continue
			const nested = /^(?:\s*-\s+(.*)|\s+([\w-]+):\s*(.*))$/.exec(line)
			if (nested && block) {
				if (block === 'depends-on' && nested[1] !== undefined) dependsOn.push(unquote(nested[1]))
				else if (block === 'resumed' && nested[2]) {
					resumed ??= {}
					;(resumed as Record<string, string>)[nested[2]] = unquote(nested[3] ?? '')
				}
				continue
			}
			const top = /^([\w-]+):\s*(.*)$/.exec(line)
			if (!top) continue
			const key = top[1] as string
			const value = unquote(top[2] ?? '')
			block = value === '' ? key : undefined
			if (key === 'resumed') {
				if (value === '') resumed = {}
			} else if (key === 'depends-on') {
				const list = /^\[(.*)\]$/.exec(value)
				const items = list ? (list[1] ?? '').split(',') : value ? [value] : []
				for (const item of items) if (unquote(item)) dependsOn.push(unquote(item))
			} else fields[key] = value
		}
	}
	let title: string | undefined
	let next: string | undefined
	for (let i = body; i < lines.length; i++) {
		const line = lines[i] as string
		if (title === undefined && /^#\s+/.test(line)) title = line.replace(/^#\s+/, '').trim()
		if (next === undefined && /^##\s+NEXT\b/.test(line)) {
			for (let j = i + 1; j < lines.length && !/^#{1,2}\s/.test(lines[j] as string); j++) {
				if ((lines[j] as string).trim()) {
					next = (lines[j] as string).trim()
					break
				}
			}
		}
	}
	return { fields, dependsOn, resumed, title, next }
}

function readFolder(dir: string): string[] {
	if (!existsSync(dir)) return []
	return readdirSync(dir)
		.filter((f) => f.endsWith('.md'))
		.sort()
}

function time(value: string | undefined): number {
	const t = value ? Date.parse(value) : Number.NaN
	return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t
}

export function formatAge(ms: number): string {
	const minutes = Math.max(0, Math.floor(ms / 60_000))
	if (minutes < 60) return `${minutes}m`
	const hours = Math.floor(minutes / 60)
	if (hours < 48) return `${hours}h`
	return `${Math.floor(hours / 24)}d`
}

const psProbe: ProcessProbe = (pid) => {
	const lstart = spawnSync('ps', ['-o', 'lstart=', '-p', String(pid)], { encoding: 'utf8' })
	if (lstart.error) return 'error'
	if (lstart.status !== 0 || !lstart.stdout.trim()) return lstart.status === 1 ? 'gone' : 'error'
	const comm = spawnSync('ps', ['-o', 'comm=', '-p', String(pid)], { encoding: 'utf8' })
	if (comm.error || comm.status !== 0) return 'error'
	return { comm: basename(comm.stdout.trim()), started: lstart.stdout.trim() }
}

const squash = (s: string) => s.replace(/\s+/g, ' ').trim()

/** Works out the liveness of a `resumed:` block as references/resume.md "Resume marker" describes. */
export function liveness(
	marker: ResumedMarker,
	opts: { committed: boolean; now: Date; probe: ProcessProbe },
): Liveness {
	const base: Liveness = { state: 'unknown', session: marker.session, at: marker.at }
	const at = time(marker.at)
	if (Number.isFinite(at)) base.age = formatAge(opts.now.getTime() - at)
	if (opts.committed) return { ...base, reason: 'the committed file carries the marker' }
	const pid = Number(marker.pid)
	if (!marker.pid || !Number.isInteger(pid) || pid <= 0 || !marker.started) {
		return { ...base, reason: 'no pid or start time' }
	}
	const name = marker.harness ? HARNESS_PROCESS[marker.harness] : undefined
	if (!name) return { ...base, reason: `unknown harness process for ${marker.harness ?? 'no harness'}` }
	const proc = opts.probe(pid)
	if (proc === 'error') return { ...base, reason: 'the process check failed' }
	if (proc === 'gone') return { ...base, state: 'dead', reason: 'the process is gone' }
	if (proc.comm !== name) return { ...base, state: 'dead', reason: `pid ${pid} is now ${proc.comm}` }
	if (squash(proc.started) !== squash(marker.started)) {
		return { ...base, state: 'dead', reason: `pid ${pid} was restarted` }
	}
	return { ...base, state: 'alive', reason: undefined }
}

function committedWithMarker(root: string, path: string): boolean {
	const rel = relative(root, path)
	const r = spawnSync('git', ['-C', root, 'show', `HEAD:${rel.split('\\').join('/')}`], { encoding: 'utf8' })
	return r.status === 0 && /^resumed:/m.test(r.stdout)
}

function namesRepo(value: string | undefined, repo: RepoInfo): boolean {
	if (!value) return false
	return value === repo.origin || value === repo.mainName || value === basename(repo.root)
}

/** Lists the checkpoints as the checkpoint skill's references/list.md describes. Writes nothing. */
export function listCheckpoints(options: ListOptions = {}): CheckpointList {
	const cwd = resolve(options.cwd ?? process.cwd())
	const home = options.home ?? homedir()
	const now = options.now ?? new Date()
	const probe = options.probe ?? psProbe
	const homeFolder = join(home, '.agents', 'repobuddy', 'checkpoints')

	const target = options.repoPath ? resolve(cwd, options.repoPath) : cwd
	const repo = readRepo(target)
	if (!repo && options.repoPath) throw new NotARepoError(`${target} is not in a git repo`)

	const folders: CheckpointList['folders'] = repo
		? [
				{ folder: 'common', path: join(repo.commonDir, 'repobuddy', 'checkpoints') },
				{ folder: 'checkout', path: join(repo.root, '.agents', 'repobuddy', 'checkpoints') },
				{ folder: 'home', path: homeFolder },
			]
		: [{ folder: 'home', path: homeFolder }]

	const copies: Array<{ slug: string; path: string; folder: CheckpointFolder; parsed: ParsedCheckpoint }> = []
	for (const { folder, path } of folders) {
		for (const file of readFolder(path)) {
			const full = join(path, file)
			const parsed = parseCheckpoint(readFileSync(full, 'utf8'))
			if (repo && folder === 'home' && !namesRepo(parsed.fields['repo'], repo)) continue
			copies.push({ slug: file.slice(0, -'.md'.length), path: full, folder, parsed })
		}
	}

	const bySlug = new Map<string, typeof copies>()
	for (const copy of copies) bySlug.set(copy.slug, [...(bySlug.get(copy.slug) ?? []), copy])

	const tree = repo ? worktrees(repo.root) : []
	const here = git(cwd, ['rev-parse', '--show-toplevel'])
	const hereRoot = here ? resolve(here) : undefined

	const rows: CheckpointRow[] = []
	for (const [slug, group] of bySlug) {
		const sorted = [...group].sort(
			(a, b) =>
				time(b.parsed.fields['updated']) - time(a.parsed.fields['updated']) ||
				FOLDER_RANK[a.folder] - FOLDER_RANK[b.folder],
		)
		const [pick, ...older] = sorted as [(typeof copies)[number], ...typeof copies]
		const { fields, dependsOn, resumed, title, next } = pick.parsed
		const branch = fields['branch']
		let checkedOut: string | null | undefined
		if (repo && branch && branch !== 'none') {
			const holder = tree.find((w) => w.branch === branch)
			checkedOut = holder ? (holder.path === hereRoot ? 'here' : holder.path) : null
		}
		rows.push({
			slug,
			title: title ?? slug,
			path: pick.path,
			folder: pick.folder,
			repo: fields['repo'],
			branch,
			checkedOut,
			updated: fields['updated'],
			next,
			dependsOn,
			waitsOn: dependsOn.filter((d) => bySlug.has(d)),
			liveness: resumed
				? liveness(resumed, {
						committed: repo !== null && pick.folder === 'checkout' && committedWithMarker(repo.root, pick.path),
						now,
						probe,
					})
				: undefined,
			olderCopies: older.map((o) => ({ path: o.path, folder: o.folder, updated: o.parsed.fields['updated'] })),
		})
	}
	rows.sort((a, b) => time(b.updated) - time(a.updated) || a.slug.localeCompare(b.slug))
	return { repo, folders, checkpoints: rows }
}

const FOLDER_LABEL: Record<CheckpointFolder, string> = {
	common: 'common git dir',
	checkout: 'this checkout',
	home: 'home folder',
}

function livenessNote(l: Liveness): string {
	const ago = l.age ? `${l.age} ago` : l.at ? `at ${l.at}` : 'at an unknown time'
	if (l.state === 'alive') return `open in session \`${l.session ?? 'unknown'}\``
	if (l.state === 'dead') return `resumed ${ago}; that session has ended (${l.reason})`
	return `resumed ${ago}, not paused since: it may be open in another session, or that session ended (${l.reason})`
}

/** The listing as text, one block per checkpoint, newest first. */
export function formatList(list: CheckpointList): string {
	if (list.checkpoints.length === 0) {
		return `No checkpoints in ${list.folders.map((f) => f.path).join(', ')}.\n`
	}
	const out: string[] = []
	for (const row of list.checkpoints) {
		out.push(`${row.title} (${row.slug})`)
		// Outside a repo the home folder mixes every repo's checkpoints, so say whose each one is.
		if (list.repo === null) out.push(`  repo: ${row.repo ?? 'none'}`)
		if (row.branch !== undefined) {
			const where =
				row.checkedOut === undefined
					? ''
					: row.checkedOut === null
						? ', not checked out'
						: row.checkedOut === 'here'
							? ', here'
							: `, at ${row.checkedOut}`
			out.push(`  branch: ${row.branch}${where}`)
		}
		if (row.updated) out.push(`  updated: ${row.updated}`)
		if (row.next) out.push(`  next: ${row.next}`)
		for (const slug of row.waitsOn) out.push(`  waits on ${slug}`)
		if (row.liveness) out.push(`  ${livenessNote(row.liveness)}`)
		if (row.folder === 'checkout') out.push('  in this checkout')
		if (row.folder === 'home') out.push(`  in ${row.path}`)
		for (const o of row.olderCopies) out.push(`  older copy in the ${FOLDER_LABEL[o.folder]}: ${o.path}`)
	}
	return `${out.join('\n')}\n`
}
