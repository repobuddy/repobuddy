/*
 * Read and write an epic's native sub-issue and blocked-by graph with the `gh` CLI (gh 2.98.0 or newer).
 *
 *   node scripts/epic-plan.mjs graph     --repo <owner/repo> --epic <ref> [--verbose]
 *   node scripts/epic-plan.mjs depend    --repo <owner/repo> --plan <file.json> [--prune] [--write] [--verbose]
 *   node scripts/epic-plan.mjs sync-body --repo <owner/repo> --epic <ref> [--write] [--verbose]
 *   node scripts/epic-plan.mjs check     --repo <owner/repo> --epic <ref> [--project <title>] [--verbose]
 *
 * A <ref> is `123`, `#123`, `owner/repo#123`, or `https://github.com/owner/repo/issues/123`. Output refs read
 * `#123` in the epic's repo and `owner/repo#123` elsewhere.
 *
 * graph      Print the epic's sub-issues, each one's blockers, blockers outside the epic, cycles, and run
 *            waves (null when there is a cycle). A cycle is data: exit 0.
 * depend     --plan is a JSON object mapping a child ref to the full list of refs that block it. Without
 *            --write, print what would change. With --write, run one `gh issue edit` per changed child and
 *            read it back. --prune also removes blockers the plan does not list; otherwise they are
 *            reported under `extra`. A plan with a cycle writes nothing and exits 1.
 * sync-body  Rebuild the `## Child Issues` list in the epic body from its native sub-issues: checkbox and
 *            title follow the sub-issue, missing ones are appended, gone ones dropped, other lines and
 *            sections are kept. --write edits the epic body.
 * check      Run the checks a cold reader runs on a filed epic: children, run-order, graph, board, links.
 *
 * stdout is JSON only; progress goes to stderr behind --verbose. Calls gh with an argument array, never a
 * shell. Never prompts.
 * Exit 0 on success, 1 when a check fails or a read or write fails, 2 on bad usage.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export type Gh = (args: string[]) => string

const USAGE = `usage: epic-plan.mjs graph --repo <owner/repo> --epic <ref> [--verbose]
       epic-plan.mjs depend --repo <owner/repo> --plan <file.json> [--prune] [--write] [--verbose]
       epic-plan.mjs sync-body --repo <owner/repo> --epic <ref> [--write] [--verbose]
       epic-plan.mjs check --repo <owner/repo> --epic <ref> [--project <title>] [--verbose]
`

class UsageError extends Error {}
class RunError extends Error {}

// ── refs ────────────────────────────────────────────────────────────────────

/** A normalized ref: `owner/repo#123`. */
type Key = string

const REF_RE =
	/https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/issues\/(\d+)|(?<![\w./-])([\w.-]+\/[\w.-]+)#(\d+)|(?<![\w/&.-])#(\d+)/g

interface Found {
	key: Key
	start: number
	end: number
}

function extractRefs(text: string, repo: string): Found[] {
	const found: Found[] = []
	for (const m of text.matchAll(REF_RE)) {
		const r = m[1] ?? m[3] ?? repo
		const n = m[2] ?? m[4] ?? m[5]
		found.push({ key: `${r}#${n}`, start: m.index, end: m.index + m[0].length })
	}
	return found
}

function parseRef(input: string, repo: string): Key {
	const s = input.trim()
	const url = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/(?:issues|pull)\/(\d+)\/?$/.exec(s)
	if (url) return `${url[1]}#${url[2]}`
	const full = /^([\w.-]+\/[\w.-]+)#(\d+)$/.exec(s)
	if (full) return `${full[1]}#${full[2]}`
	const num = /^#?(\d+)$/.exec(s)
	if (num) return `${repo}#${num[1]}`
	throw new UsageError(`not an issue ref: ${input}`)
}

const repoOf = (k: Key) => k.slice(0, k.lastIndexOf('#'))
const numOf = (k: Key) => k.slice(k.lastIndexOf('#') + 1)
const same = (a: Key, b: Key) => a.toLowerCase() === b.toLowerCase()
const norm = (k: Key): Key => `${repoOf(k).toLowerCase()}#${numOf(k)}`
const fmt = (k: Key, repo: string) => (repoOf(k).toLowerCase() === repo.toLowerCase() ? `#${numOf(k)}` : k)
const fmtAll = (ks: Key[], repo: string) => ks.map((k) => fmt(k, repo))

function keyFromUrl(url: string, fallbackRepo: string, number: number): Key {
	const m = /github\.com\/([^/]+\/[^/]+)\/(?:issues|pull)\/(\d+)/.exec(url ?? '')
	return m ? `${m[1]}#${m[2]}` : `${fallbackRepo}#${number}`
}

// ── gh ──────────────────────────────────────────────────────────────────────

const realGh: Gh = (args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })

interface Node {
	number: number
	title: string
	state: string
	url: string
}

interface Issue {
	key: Key
	title: string
	state: string
	url: string
	body: string
	subIssues: Key[]
	subNodes: Node[]
	blockedBy: Key[]
	projects: string[]
}

function view(gh: Gh, key: Key, fields: string): Issue {
	const repo = repoOf(key)
	let raw: string
	try {
		raw = gh(['issue', 'view', numOf(key), '--repo', repo, '--json', fields])
	} catch (e) {
		throw new RunError(`gh issue view ${key} failed: ${(e as Error).message.split('\n')[0]}`)
	}
	const j = JSON.parse(raw)
	const nodes = (x: { nodes?: Node[] } | Node[] | undefined): Node[] => (Array.isArray(x) ? x : (x?.nodes ?? []))
	const subNodes = nodes(j.subIssues)
	return {
		key: j.url ? keyFromUrl(j.url, repo, j.number) : key,
		title: j.title ?? '',
		state: j.state ?? '',
		url: j.url ?? '',
		body: j.body ?? '',
		subIssues: subNodes.map((n) => keyFromUrl(n.url, repo, n.number)),
		subNodes,
		blockedBy: nodes(j.blockedBy).map((n) => keyFromUrl(n.url, repo, n.number)),
		projects: ((j.projectItems as { title: string }[] | undefined) ?? []).map((p) => p.title),
	}
}

interface Epic {
	issue: Issue
	repo: string
	children: Issue[]
}

function loadEpic(gh: Gh, key: Key, log: (m: string) => void): Epic {
	log(`reading epic ${key}`)
	const issue = view(gh, key, 'number,title,url,body,subIssues,projectItems')
	const children = issue.subNodes.map((n, i) => {
		const ck = issue.subIssues[i]!
		log(`reading child ${ck}`)
		const c = view(gh, ck, 'number,title,state,url,blockedBy,projectItems')
		return { ...c, key: ck, title: c.title || n.title, state: c.state || n.state, url: c.url || n.url }
	})
	return { issue, repo: repoOf(key), children }
}

// ── graph ───────────────────────────────────────────────────────────────────

function analyze(graph: Map<Key, Key[]>): { cycles: Key[][]; waves: Key[][] | null } {
	const cycles: Key[][] = []
	const state = new Map<Key, 1 | 2>()
	const stack: Key[] = []
	const visit = (k: Key) => {
		state.set(k, 1)
		stack.push(k)
		for (const b of graph.get(k) ?? []) {
			if (!graph.has(b)) continue
			if (state.get(b) === 1) cycles.push(stack.slice(stack.indexOf(b)))
			else if (!state.has(b)) visit(b)
		}
		stack.pop()
		state.set(k, 2)
	}
	for (const k of graph.keys()) if (!state.has(k)) visit(k)
	if (cycles.length) return { cycles, waves: null }
	const memo = new Map<Key, number>()
	const wave = (k: Key): number => {
		const hit = memo.get(k)
		if (hit) return hit
		const w = 1 + Math.max(0, ...(graph.get(k) ?? []).filter((b) => graph.has(b)).map(wave))
		memo.set(k, w)
		return w
	}
	const waves: Key[][] = []
	for (const k of graph.keys()) (waves[wave(k) - 1] ??= []).push(k)
	return { cycles, waves }
}

function childGraph(epic: Epic): Map<Key, Key[]> {
	const g = new Map<Key, Key[]>()
	const keys = new Set(epic.children.map((c) => norm(c.key)))
	for (const c of epic.children)
		g.set(
			norm(c.key),
			c.blockedBy.map(norm).filter((b) => keys.has(b)),
		)
	return g
}

function graphCmd(gh: Gh, epicKey: Key, log: (m: string) => void) {
	const epic = loadEpic(gh, epicKey, log)
	const g = childGraph(epic)
	const { cycles, waves } = analyze(g)
	const outside: Key[] = []
	for (const c of epic.children)
		for (const b of c.blockedBy) if (!g.has(norm(b)) && !outside.some((o) => same(o, b))) outside.push(b)
	const r = epic.repo
	const display = new Map(epic.children.map((c) => [norm(c.key), c.key]))
	const show = (k: Key) => fmt(display.get(k) ?? k, r)
	return {
		epic: fmt(epic.issue.key, r),
		children: epic.children.map((c) => ({
			ref: fmt(c.key, r),
			title: c.title,
			state: c.state,
			url: c.url,
			blockedBy: fmtAll(c.blockedBy, r),
		})),
		outside: fmtAll(outside, r),
		cycles: cycles.map((c) => c.map(show)),
		waves: waves ? waves.map((w) => w.map(show)) : null,
	}
}

// ── depend ──────────────────────────────────────────────────────────────────

const refArg = (k: Key, childRepo: string) =>
	repoOf(k).toLowerCase() === childRepo.toLowerCase() ? numOf(k) : `https://github.com/${repoOf(k)}/issues/${numOf(k)}`

const diff = (a: Key[], b: Key[]) => a.filter((x) => !b.some((y) => same(x, y)))

function dependCmd(gh: Gh, repo: string, planFile: string, prune: boolean, write: boolean, log: (m: string) => void) {
	let raw: unknown
	try {
		raw = JSON.parse(readFileSync(planFile, 'utf8'))
	} catch (e) {
		throw new UsageError(`cannot read plan ${planFile}: ${(e as Error).message}`)
	}
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new UsageError('plan must be a JSON object')
	const plan = new Map<Key, Key[]>()
	for (const [child, list] of Object.entries(raw)) {
		if (!Array.isArray(list) || list.some((x) => typeof x !== 'string'))
			throw new UsageError(`plan entry ${child} must be an array of refs`)
		plan.set(
			parseRef(child, repo),
			(list as string[]).map((x) => parseRef(x, repo)),
		)
	}
	const { cycles } = analyze(new Map([...plan].map(([k, v]) => [norm(k), v.map(norm)])))
	if (cycles.length)
		return {
			code: 1,
			out: { written: false, error: 'the planned graph has a cycle', cycles: cycles.map((c) => fmtAll(c, repo)) },
		}
	const changes: { child: Key; add: Key[]; remove: Key[]; extra: Key[] }[] = []
	for (const [child, planned] of plan) {
		log(`reading ${child}`)
		const current = view(gh, child, 'number,blockedBy').blockedBy
		const add = diff(planned, current)
		const stale = diff(current, planned)
		const remove = prune ? stale : []
		const extra = prune ? [] : stale
		if (add.length || remove.length || extra.length) changes.push({ child, add, remove, extra })
	}
	const show = (c: (typeof changes)[number]) => ({
		child: fmt(c.child, repo),
		add: fmtAll(c.add, repo),
		remove: fmtAll(c.remove, repo),
		extra: fmtAll(c.extra, repo),
	})
	if (!write) return { code: 0, out: { written: false, changes: changes.map(show) } }
	const results: { child: string; ok: boolean; error?: string; verified: boolean }[] = []
	for (const c of changes.filter((x) => x.add.length || x.remove.length)) {
		const childRepo = repoOf(c.child)
		const args = ['issue', 'edit', numOf(c.child), '--repo', childRepo]
		if (c.add.length) args.push('--add-blocked-by', c.add.map((k) => refArg(k, childRepo)).join(','))
		if (c.remove.length) args.push('--remove-blocked-by', c.remove.map((k) => refArg(k, childRepo)).join(','))
		const label = fmt(c.child, repo)
		try {
			log(`writing ${label}`)
			gh(args)
		} catch (e) {
			results.push({ child: label, ok: false, error: (e as Error).message.split('\n')[0] ?? '', verified: false })
			continue
		}
		try {
			const now = view(gh, c.child, 'number,blockedBy').blockedBy
			const verified = diff(c.add, now).length === 0 && c.remove.every((r) => !now.some((n) => same(n, r)))
			results.push({ child: label, ok: true, verified })
		} catch (e) {
			results.push({ child: label, ok: true, error: (e as Error).message, verified: false })
		}
	}
	const ok = results.every((r) => r.ok && r.verified)
	return { code: ok ? 0 : 1, out: { written: true, changes: changes.map(show), results } }
}

// ── sync-body ───────────────────────────────────────────────────────────────

const LIST_RE = /^[-*]\s+\[([ xX])\]\s+(.*)$/

function leadingRef(line: string, repo: string): Found | undefined {
	const m = LIST_RE.exec(line)
	const ref = m && extractRefs(m[2]!, repo)[0]
	return ref && ref.start === 0 ? ref : undefined
}

interface SyncResult {
	found: boolean
	body: string
	added: Key[]
	removed: Key[]
	updated: Key[]
	unmatched: string[]
}

function syncBody(body: string, subs: { key: Key; title: string; state: string }[], repo: string): SyncResult {
	const lines = body.split('\n')
	const h = lines.findIndex((l) => /^##\s+Child Issues\s*$/.test(l))
	if (h < 0) return { found: false, body, added: [], removed: [], updated: [], unmatched: [] }
	let end = lines.findIndex((l, i) => i > h && /^#{1,2}\s/.test(l))
	if (end < 0) end = lines.length
	const section = lines.slice(h + 1, end)
	const native = new Map(subs.map((s) => [norm(s.key), s]))
	const seen = new Set<Key>()
	const out: string[] = []
	const other: string[] = []
	const added: Key[] = []
	const removed: Key[] = []
	const updated: Key[] = []
	const unmatched: string[] = []
	const refd = new Set<Key>()
	for (const line of section) {
		const ref = leadingRef(line, repo)
		if (ref) refd.add(norm(ref.key))
	}
	let firstList = -1
	section.forEach((line, i) => {
		const m = LIST_RE.exec(line)
		const ref = m && extractRefs(m[2]!, repo)[0]
		if (m && !(ref && ref.start === 0)) {
			// A list line with no ref, written before the children were filed: match by exact title.
			if (firstList < 0) firstList = i
			const title = m[2]!.trim()
			const sub = subs.find((x) => x.title === title && !refd.has(norm(x.key)) && !seen.has(norm(x.key)))
			if (!sub) {
				unmatched.push(title)
				out.push(line)
				return
			}
			seen.add(norm(sub.key))
			out.push(`- [${sub.state === 'CLOSED' ? 'x' : ' '}] ${fmt(sub.key, repo)} ${sub.title}`)
			updated.push(sub.key)
			return
		}
		if (!m || !ref) {
			other.push(line)
			return
		}
		if (firstList < 0) firstList = i
		const k = norm(ref.key)
		if (seen.has(k)) return
		seen.add(k)
		const sub = native.get(k)
		if (!sub) {
			removed.push(ref.key)
			return
		}
		const text = m[2]!
		const closed = sub.state === 'CLOSED'
		if ((m[1] !== ' ') === closed && text.slice(ref.end).trim() === sub.title) out.push(line)
		else {
			out.push(`- [${closed ? 'x' : ' '}] ${text.slice(0, ref.end)} ${sub.title}`)
			updated.push(ref.key)
		}
	})
	for (const s of subs)
		if (!seen.has(norm(s.key))) {
			out.push(`- [${s.state === 'CLOSED' ? 'x' : ' '}] ${fmt(s.key, repo)} ${s.title}`)
			added.push(s.key)
		}
	// Lines before the first list line stay before it; every other non-list line follows the list.
	let rebuilt: string[]
	if (firstList >= 0) rebuilt = [...section.slice(0, firstList), ...out, ...other.slice(firstList)]
	else if (out.length) rebuilt = ['', ...out, '', ...(section[0] === '' ? section.slice(1) : section)]
	else rebuilt = section
	return {
		found: true,
		body: [...lines.slice(0, h + 1), ...rebuilt, ...lines.slice(end)].join('\n'),
		added,
		removed,
		updated,
		unmatched,
	}
}

function syncBodyCmd(gh: Gh, epicKey: Key, write: boolean, log: (m: string) => void) {
	const epic = loadEpic(gh, epicKey, log)
	const r = epic.repo
	const subs = epic.children.map((c) => ({ key: c.key, title: c.title, state: c.state }))
	const res = syncBody(epic.issue.body, subs, r)
	if (!res.found) return { code: 1, out: { error: 'the epic body has no "## Child Issues" section' } }
	const changed = res.body !== epic.issue.body
	const out: Record<string, unknown> = {
		changed,
		added: fmtAll(res.added, r),
		removed: fmtAll(res.removed, r),
		updated: fmtAll(res.updated, r),
		unmatched: res.unmatched,
		body: res.body,
	}
	if (write && changed) {
		const dir = mkdtempSync(join(tmpdir(), 'epic-plan-'))
		try {
			const file = join(dir, 'body.md')
			writeFileSync(file, res.body)
			log(`writing body of ${epicKey}`)
			try {
				gh(['issue', 'edit', numOf(epicKey), '--repo', repoOf(epicKey), '--body-file', file])
			} catch (e) {
				return { code: 1, out: { ...out, written: false, error: (e as Error).message.split('\n')[0] } }
			}
			out['written'] = true
		} finally {
			rmSync(dir, { recursive: true, force: true })
		}
	}
	return { code: 0, out }
}

// ── check ───────────────────────────────────────────────────────────────────

type Status = 'pass' | 'fail' | 'skip'
interface CheckResult {
	id: string
	status: Status
	detail: string[]
}

const result = (id: string, detail: string[], skip = false): CheckResult => ({
	id,
	status: skip ? 'skip' : detail.length ? 'fail' : 'pass',
	detail,
})

function checkChildren(epic: Epic): CheckResult {
	const r = epic.repo
	const lines = epic.issue.body.split('\n')
	const h = lines.findIndex((l) => /^##\s+Child Issues\s*$/.test(l))
	if (h < 0) return result('children', ['the epic body has no "## Child Issues" section'])
	let end = lines.findIndex((l, i) => i > h && /^#{1,2}\s/.test(l))
	if (end < 0) end = lines.length
	const listed: Key[] = []
	const detail: string[] = []
	for (const line of lines.slice(h + 1, end)) {
		const m = LIST_RE.exec(line)
		if (!m) continue
		const ref = leadingRef(line, r)
		if (ref) listed.push(ref.key)
		else {
			const title = m[2]!.trim()
			const sub = epic.children.find((c) => c.title === title)
			detail.push(
				sub
					? `the line "${title}" has no issue ref; it matches ${fmt(sub.key, r)} (run sync-body)`
					: `the line "${title}" has no issue ref and matches no sub-issue title`,
			)
			if (sub) listed.push(sub.key)
		}
	}
	const native = epic.children.map((c) => c.key)
	for (const k of listed)
		if (!native.some((n) => same(n, k))) detail.push(`${fmt(k, r)} is listed but is not a sub-issue`)
	for (const k of native)
		if (!listed.some((l) => same(l, k))) detail.push(`${fmt(k, r)} is a sub-issue but is not listed`)
	if (listed.length !== native.length)
		detail.push(`the list has ${listed.length} lines, the epic has ${native.length} sub-issues`)
	return result('children', detail)
}

function tables(body: string): string[][][] {
	const lines = body.split('\n')
	const found: string[][][] = []
	for (let i = 0; i < lines.length; i++) {
		if (!/^\s*\|/.test(lines[i]!) || !/^\s*\|[\s:|-]+\|?\s*$/.test(lines[i + 1] ?? '')) continue
		const rows: string[][] = []
		let j = i
		for (; j < lines.length && /^\s*\|/.test(lines[j]!); j++) if (j !== i + 1) rows.push(cells(lines[j]!))
		found.push(rows)
		i = j
	}
	return found
}

function cells(line: string): string[] {
	const t = line.trim().replace(/^\|/, '').replace(/\|$/, '')
	return t.split(/(?<!\\)\|/).map((c) => c.trim())
}

function checkRunOrder(epic: Epic): CheckResult {
	const r = epic.repo
	const startsWithRef = (c: string) => extractRefs(c, r)[0]?.start === 0
	for (const rows of tables(epic.issue.body)) {
		const header = rows[0]!.map((c) => c.toLowerCase())
		const blockedCol = header.indexOf('blocked by')
		if (blockedCol < 0) continue
		const body = rows.slice(1)
		const issueCol = header.findIndex(
			(_, i) => i !== blockedCol && body.length > 0 && body.every((row) => startsWithRef(row[i] ?? '')),
		)
		if (issueCol < 0) continue
		const waveCol = header.indexOf('wave')
		const detail: string[] = []
		const byChild = new Map(epic.children.map((c) => [norm(c.key), c]))
		const rowWave = new Map<Key, number>()
		const count = new Map<Key, number>()
		const parsed = body.map((row) => {
			const child = norm(extractRefs(row[issueCol]!, r)[0]!.key)
			count.set(child, (count.get(child) ?? 0) + 1)
			const blockers = extractRefs(row[blockedCol] ?? '', r).map((f) => norm(f.key))
			const wave = waveCol >= 0 ? Number.parseInt(row[waveCol] ?? '', 10) : Number.NaN
			if (!Number.isNaN(wave)) rowWave.set(child, wave)
			return { child, blockers, wave }
		})
		for (const { child, blockers, wave } of parsed) {
			const c = byChild.get(child)
			if (!c) {
				detail.push(`row ${fmt(child, r)} is not a sub-issue of the epic`)
				continue
			}
			const actual = c.blockedBy.map(norm)
			const missing = diff(actual, blockers)
			const extra = diff(blockers, actual)
			if (missing.length)
				detail.push(`${fmt(child, r)}: native blocked by ${fmtAll(missing, r).join(', ')} is not in the table`)
			if (extra.length)
				detail.push(`${fmt(child, r)}: the table lists ${fmtAll(extra, r).join(', ')}, which is not a native blocker`)
			if (waveCol >= 0)
				for (const b of actual) {
					const bw = rowWave.get(b)
					if (byChild.has(b) && !Number.isNaN(wave) && bw !== undefined && bw >= wave)
						detail.push(`${fmt(child, r)} (wave ${wave}) is not after its blocker ${fmt(b, r)} (wave ${bw})`)
				}
		}
		for (const c of epic.children) {
			const n = count.get(norm(c.key)) ?? 0
			if (n !== 1) detail.push(`${fmt(c.key, r)} appears in ${n} table rows, expected 1`)
		}
		return result('run-order', detail)
	}
	return result('run-order', ['no run-order table (a "Blocked by" column)'], true)
}

function checkGraph(epic: Epic): CheckResult {
	const { cycles } = analyze(childGraph(epic))
	return result(
		'graph',
		cycles.map((c) => `cycle: ${fmtAll([...c, c[0]!], epic.repo).join(' -> ')}`),
	)
}

function checkBoard(epic: Epic, project: string | undefined): CheckResult {
	if (!project) return result('board', ['no --project given'], true)
	const detail = [epic.issue, ...epic.children]
		.filter((i) => !i.projects.includes(project))
		.map((i) => `${fmt(i.key, epic.repo)} is not on the project "${project}"`)
	return result('board', detail)
}

function checkLinks(gh: Gh, epic: Epic, log: (m: string) => void): CheckResult {
	const r = epic.repo
	const resolved = new Map<Key, Key | null>()
	const detail: string[] = []
	let fence = false
	for (const line of epic.issue.body.split('\n')) {
		if (/^\s*(```|~~~)/.test(line)) {
			fence = !fence
			continue
		}
		if (fence) continue
		const text = line.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length))
		const refs = extractRefs(text, r)
		for (const { key } of refs) {
			const k = norm(key)
			if (!resolved.has(k)) {
				log(`resolving ${key}`)
				try {
					const j = JSON.parse(gh(['issue', 'view', numOf(key), '--repo', repoOf(key), '--json', 'url,number']))
					resolved.set(k, norm(keyFromUrl(j.url, repoOf(key), j.number)))
				} catch {
					resolved.set(k, null)
				}
			}
			const to = resolved.get(k)
			if (to === null || to === undefined) {
				const msg = `${fmt(key, r)} does not resolve`
				if (!detail.includes(msg)) detail.push(msg)
			} else if (to !== k && !refs.some((o) => norm(o.key) === to)) {
				const msg = `${fmt(key, r)} now resolves to ${fmt(to, r)} (transferred) and the line does not name the new ref`
				if (!detail.includes(msg)) detail.push(msg)
			}
		}
	}
	return result('links', detail)
}

function checkCmd(gh: Gh, epicKey: Key, project: string | undefined, log: (m: string) => void) {
	const epic = loadEpic(gh, epicKey, log)
	const checks = [
		checkChildren(epic),
		checkRunOrder(epic),
		checkGraph(epic),
		checkBoard(epic, project),
		checkLinks(gh, epic, log),
	]
	return { code: checks.some((c) => c.status === 'fail') ? 1 : 0, out: { checks } }
}

// ── main ────────────────────────────────────────────────────────────────────

interface Options {
	command: 'graph' | 'depend' | 'sync-body' | 'check'
	repo: string
	epic?: string
	plan?: string
	project?: string
	prune: boolean
	write: boolean
	verbose: boolean
}

function parseArgs(argv: string[]): Options {
	const [command, ...rest] = argv
	if (command !== 'graph' && command !== 'depend' && command !== 'sync-body' && command !== 'check')
		throw new UsageError('unknown command')
	const o: Options = { command, repo: '', prune: false, write: false, verbose: false }
	for (let i = 0; i < rest.length; i++) {
		const a = rest[i]!
		const value = () => {
			const v = rest[++i]
			if (v === undefined) throw new UsageError(`${a} needs a value`)
			return v
		}
		if (a === '--repo') o.repo = value()
		else if (a === '--epic' && command !== 'depend') o.epic = value()
		else if (a === '--plan' && command === 'depend') o.plan = value()
		else if (a === '--project' && command === 'check') o.project = value()
		else if (a === '--prune' && command === 'depend') o.prune = true
		else if (a === '--write' && (command === 'depend' || command === 'sync-body')) o.write = true
		else if (a === '--verbose') o.verbose = true
		else throw new UsageError(`unexpected argument ${a}`)
	}
	if (!/^[\w.-]+\/[\w.-]+$/.test(o.repo)) throw new UsageError('--repo <owner/repo> is required')
	if (command === 'depend' ? !o.plan : !o.epic)
		throw new UsageError(command === 'depend' ? '--plan is required' : '--epic is required')
	return o
}

export interface RunResult {
	code: number
	stdout: string
	stderr: string
}

/** Run one command against `gh`; returns what the process would print and its exit code. */
export function run(argv: string[], gh: Gh = realGh): RunResult {
	let stderr = ''
	let o: Options
	try {
		o = parseArgs(argv)
	} catch (e) {
		return { code: 2, stdout: '', stderr: `epic-plan: ${(e as Error).message}\n${USAGE}` }
	}
	const log = (m: string) => {
		if (o.verbose) stderr += `${m}\n`
	}
	try {
		const epic = o.epic ? parseRef(o.epic, o.repo) : ''
		const r =
			o.command === 'graph'
				? { code: 0, out: graphCmd(gh, epic, log) }
				: o.command === 'depend'
					? dependCmd(gh, o.repo, o.plan!, o.prune, o.write, log)
					: o.command === 'sync-body'
						? syncBodyCmd(gh, epic, o.write, log)
						: checkCmd(gh, epic, o.project, log)
		return { code: r.code, stdout: `${JSON.stringify(r.out, null, 2)}\n`, stderr }
	} catch (e) {
		if (e instanceof UsageError) return { code: 2, stdout: '', stderr: `epic-plan: ${e.message}\n${USAGE}` }
		if (!(e instanceof RunError)) throw e
		return {
			code: 1,
			stdout: `${JSON.stringify({ error: e.message })}\n`,
			stderr: `${stderr}epic-plan: ${e.message}\n`,
		}
	}
}

function main(argv: string[] = process.argv.slice(2)): void {
	const r = run(argv)
	if (r.stdout) process.stdout.write(r.stdout)
	if (r.stderr) process.stderr.write(r.stderr)
	process.exit(r.code)
}

// Process-boundary guard: only fires when the bundle runs directly as a script.
/* istanbul ignore next -- process.argv entrypoint guard, covered by bundles.spec.ts (child process) */
if (process.argv[1]?.endsWith('epic-plan.mjs')) main()
