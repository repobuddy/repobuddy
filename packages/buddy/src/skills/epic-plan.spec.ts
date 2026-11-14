import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from '@jest/globals'
import { run } from './epic-plan.js'

const R = 'repobuddy/.github'
const fixture = JSON.parse(readFileSync(join(import.meta.dirname, '__fixtures__', 'epic-79', 'epic-79.json'), 'utf8'))

type Blocked = Record<string, number[]>
interface World {
	epic: typeof fixture.epic
	children: Record<string, any>
	/** issue number -> url, for ref resolution (transfers) */
	urls?: Record<string, string>
	failEdit?: boolean
}

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x))
const node = (n: number) => {
	const c = fixture.children[String(n)]
	return { number: n, title: c.title, state: c.state, url: c.url }
}

function world(
	opts: { blocked?: Blocked; body?: (b: string) => string; closed?: number[]; drop?: number[] } = {},
): World {
	const w: World = { epic: clone(fixture.epic), children: clone(fixture.children) }
	for (const [n, bs] of Object.entries(opts.blocked ?? {})) w.children[n].blockedBy = { nodes: bs.map(node) }
	for (const n of opts.closed ?? []) w.children[String(n)].state = 'CLOSED'
	w.epic.subIssues.nodes = w.epic.subIssues.nodes
		.filter((s: any) => !opts.drop?.includes(s.number))
		.map((s: any) => ({ ...s, state: w.children[String(s.number)].state }))
	if (opts.body) w.epic.body = opts.body(w.epic.body)
	return w
}

function fake(w: World) {
	const calls: string[][] = []
	const gh = (args: string[]) => {
		calls.push(args)
		const [a, b, num, , repo, , fields] = args
		if (a === 'issue' && b === 'view') {
			if (repo === R && num === '79') return JSON.stringify(w.epic)
			if (repo === R && w.children[num!]) return JSON.stringify(w.children[num!])
			const url = w.urls?.[`${repo}#${num}`] ?? `https://github.com/${repo}/issues/${num}`
			if (fields === 'url,number') return JSON.stringify({ url, number: Number(num) })
			throw new Error('not found')
		}
		if (a === 'issue' && b === 'edit') {
			if (w.failEdit) throw new Error('boom\nsecond line')
			const add = args[args.indexOf('--add-blocked-by') + 1]
			const rm = args[args.indexOf('--remove-blocked-by') + 1]
			const cur: any[] = w.children[num!].blockedBy.nodes
			if (args.includes('--add-blocked-by')) for (const n of add!.split(',')) cur.push(node(Number(n)))
			if (args.includes('--remove-blocked-by'))
				w.children[num!].blockedBy.nodes = cur.filter((c) => !rm!.split(',').includes(String(c.number)))
		}
		return ''
	}
	return { gh, calls }
}

const base = ['--repo', R]
const json = (r: { stdout: string }) => JSON.parse(r.stdout)

describe('usage', () => {
	it('exits 2 with a usage line on bad usage', () => {
		for (const argv of [
			[],
			['nope'],
			['graph'],
			['graph', ...base],
			['graph', ...base, '--epic', 'x'],
			['depend', ...base],
		]) {
			const r = run(argv, () => {
				throw new Error('no gh')
			})
			expect(r.code).toBe(2)
			expect(r.stderr).toMatch(/usage: epic-plan\.mjs/)
			expect(r.stdout).toBe('')
		}
	})

	it.each(['79', '#79', 'repobuddy/.github#79', 'https://github.com/repobuddy/.github/issues/79'])(
		'accepts the ref %s',
		(ref) => {
			const r = run(['graph', ...base, '--epic', ref], fake(world()).gh)
			expect(r.code).toBe(0)
			expect(json(r).epic).toBe('#79')
		},
	)
})

describe('graph', () => {
	it('lists children, blockers, and longest-path waves of epic 79', () => {
		const { gh, calls } = fake(world())
		const r = run(['graph', ...base, '--epic', '79'], gh)
		expect(r.code).toBe(0)
		const out = json(r)
		expect(out.children).toHaveLength(11)
		expect(out.children.find((c: any) => c.ref === '#83').blockedBy).toEqual(['#82', '#81'])
		expect(out.outside).toEqual([])
		expect(out.cycles).toEqual([])
		expect(out.waves).toEqual([['#80', '#82'], ['#81', '#85', '#90', '#91'], ['#83', '#86'], ['#84', '#87'], ['#88']])
		expect(calls[0]).toEqual([
			'issue',
			'view',
			'79',
			'--repo',
			R,
			'--json',
			'number,title,url,body,subIssues,projectItems',
		])
	})

	it('reports blockers outside the epic and prints other repos in full', () => {
		const w = world()
		w.children['80'].blockedBy = {
			nodes: [{ number: 5, state: 'OPEN', title: 't', url: 'https://github.com/other/repo/issues/5' }],
		}
		const out = json(run(['graph', ...base, '--epic', '79'], fake(w).gh))
		expect(out.outside).toEqual(['other/repo#5'])
		expect(out.children[0].blockedBy).toEqual(['other/repo#5'])
	})

	it('reports a cycle as data, with waves null and exit 0', () => {
		const w = world({ blocked: { 80: [81] } })
		const r = run(['graph', ...base, '--epic', '79'], fake(w).gh)
		expect(r.code).toBe(0)
		const out = json(r)
		expect(out.waves).toBeNull()
		expect(out.cycles).toEqual([['#80', '#81']])
	})

	it('exits 1 with a JSON error when gh fails', () => {
		const r = run(['graph', ...base, '--epic', '79'], () => {
			throw new Error('HTTP 404')
		})
		expect(r.code).toBe(1)
		expect(json(r).error).toMatch(/gh issue view repobuddy\/\.github#79 failed/)
	})

	it('prints progress on stderr only with --verbose', () => {
		expect(run(['graph', ...base, '--epic', '79'], fake(world()).gh).stderr).toBe('')
		expect(run(['graph', ...base, '--epic', '79', '--verbose'], fake(world()).gh).stderr).toMatch(/reading epic/)
	})
})

describe('depend', () => {
	const plan = (p: unknown) => {
		const f = join(mkdtempSync(join(tmpdir(), 'epic-plan-')), 'plan.json')
		writeFileSync(f, JSON.stringify(p))
		return f
	}

	it('dry run reports add, and extra without --prune, and writes nothing', () => {
		const w = world()
		const { gh, calls } = fake(w)
		const f = plan({ 80: [], 84: ['83'], '#86': ['85', '90'], 83: ['82'] })
		const r = run(['depend', ...base, '--plan', f], gh)
		expect(r.code).toBe(0)
		expect(json(r)).toEqual({
			written: false,
			changes: [
				{ child: '#83', add: [], remove: [], extra: ['#81'] },
				{ child: '#86', add: ['#90'], remove: [], extra: [] },
			],
		})
		expect(calls.every((c) => c[1] === 'view')).toBe(true)
	})

	it('--prune --write runs one gh issue edit per child with comma-joined refs, then verifies', () => {
		const w = world()
		const { gh, calls } = fake(w)
		const f = plan({ 83: ['82'], 86: ['85', '90', '91'], 84: ['83'] })
		const r = run(['depend', ...base, '--plan', f, '--prune', '--write'], gh)
		expect(r.code).toBe(0)
		expect(calls.filter((c) => c[1] === 'edit')).toEqual([
			['issue', 'edit', '83', '--repo', R, '--remove-blocked-by', '81'],
			['issue', 'edit', '86', '--repo', R, '--add-blocked-by', '90,91'],
		])
		expect(json(r).results).toEqual([
			{ child: '#83', ok: true, verified: true },
			{ child: '#86', ok: true, verified: true },
		])
		expect(json(r).written).toBe(true)
	})

	it('adds and removes in one edit call', () => {
		const { gh, calls } = fake(world())
		const f = plan({ 83: ['82', '80'] })
		run(['depend', ...base, '--plan', f, '--prune', '--write'], gh)
		expect(calls.find((c) => c[1] === 'edit')).toEqual([
			'issue',
			'edit',
			'83',
			'--repo',
			R,
			'--add-blocked-by',
			'80',
			'--remove-blocked-by',
			'81',
		])
	})

	it('exits 1 when an edit fails', () => {
		const w = world()
		w.failEdit = true
		const r = run(['depend', ...base, '--plan', plan({ 84: ['83', '80'] }), '--write'], fake(w).gh)
		expect(r.code).toBe(1)
		expect(json(r).results).toEqual([{ child: '#84', ok: false, error: 'boom', verified: false }])
	})

	it('exits 1 when a write does not verify', () => {
		const w = world()
		const { gh } = fake(w)
		const lying = (args: string[]) => (args[1] === 'edit' ? '' : gh(args))
		const r = run(['depend', ...base, '--plan', plan({ 84: ['83', '80'] }), '--write'], lying)
		expect(r.code).toBe(1)
		expect(json(r).results).toEqual([{ child: '#84', ok: true, verified: false }])
	})

	it('refuses a planned cycle and writes nothing', () => {
		const { gh, calls } = fake(world())
		const r = run(['depend', ...base, '--plan', plan({ 80: ['81'], 81: ['80'] }), '--write'], gh)
		expect(r.code).toBe(1)
		expect(json(r).cycles).toEqual([['#80', '#81']])
		expect(calls).toEqual([])
	})

	it('rejects a malformed plan with exit 2', () => {
		expect(run(['depend', ...base, '--plan', plan([1])], fake(world()).gh).code).toBe(2)
		expect(run(['depend', ...base, '--plan', plan({ 80: 'x' })], fake(world()).gh).code).toBe(2)
		expect(run(['depend', ...base, '--plan', '/no/such/plan.json'], fake(world()).gh).code).toBe(2)
	})
})

describe('sync-body', () => {
	const sync = (w: World, extra: string[] = []) => {
		const f = fake(w)
		const r = run(['sync-body', ...base, '--epic', '79', ...extra], f.gh)
		return { ...f, r, out: r.stdout ? json(r) : undefined }
	}
	const section = (body: string) => /## Child Issues\n[\s\S]*?(?=\n## )/.exec(body)![0]
	const outside = (body: string) => body.replace(section(body), '')

	it('leaves the real epic 79 body byte-identical', () => {
		const { out, r } = sync(world())
		expect(r.code).toBe(0)
		expect(out.changed).toBe(false)
		expect(out.body).toBe(fixture.epic.body)
	})

	it('checks off closed children and keeps other section lines and sections intact', () => {
		const { out } = sync(world({ closed: [80] }))
		expect(out.changed).toBe(true)
		expect(out.updated).toEqual(['#80'])
		expect(section(out.body)).toContain('- [x] #80 Spike: which workflows')
		expect(section(out.body)).toContain(
			'\nClosed: #89, superseded by repobuddy/github-app#40.\n\nRelated: #57, repobuddy/github-app#40',
		)
		expect(outside(out.body)).toBe(outside(fixture.epic.body))
	})

	it('updates a changed title and keeps the line order', () => {
		const w = world()
		w.children['81'].title = 'New title'
		w.epic.subIssues.nodes.find((s: any) => s.number === 81).title = 'New title'
		const { out } = sync(w)
		expect(out.updated).toEqual(['#81'])
		const lines = section(out.body).split('\n')
		expect(lines[2]).toBe(
			'- [ ] #80 Spike: which workflows consume GitHub App or bot credentials across all owned orgs?',
		)
		expect(lines[3]).toBe('- [ ] #81 New title')
	})

	it('appends missing sub-issues after the list in native order', () => {
		const w = world({
			body: (b) => b.replace(/- \[ \] #(84|85|91) .*\n/g, ''),
		})
		const { out } = sync(w)
		expect(out.added).toEqual(['#84', '#85', '#91'])
		const lines = section(out.body).split('\n')
		const at = lines.findIndex((l) => l.startsWith('- [ ] #88'))
		expect(lines.slice(at + 1, at + 4).map((l) => l.slice(0, 9))).toEqual(['- [ ] #84', '- [ ] #85', '- [ ] #91'])
		expect(lines[at + 4]).toBe('')
		expect(lines[at + 5]).toMatch(/^Closed: #89/)
		expect(outside(out.body)).toBe(outside(fixture.epic.body))
	})

	it('matches ref-less list lines by exact title and reports the ones it cannot match', () => {
		const w = world({
			body: (b) => b.replace('- [ ] #81 ', '- [ ] ').replace('- [ ] #83 ', '- [ ] unknown thing\n- [ ] #83 '),
		})
		const { out } = sync(w)
		expect(out.updated).toEqual(['#81'])
		expect(out.unmatched).toEqual(['unknown thing'])
		expect(out.added).toEqual([])
		expect(section(out.body)).toContain('- [ ] #81 Spike: what permissions and events does the repobuddy app need?')
		expect(section(out.body)).toContain('- [ ] unknown thing\n- [ ] #83 ')
	})

	it('drops list lines that are no longer sub-issues', () => {
		const { out } = sync(world({ drop: [86] }))
		expect(out.removed).toEqual(['#86'])
		expect(out.body).not.toContain('- [ ] #86')
		expect(section(out.body)).toContain('Closed: #89')
	})

	it('--write passes the body through a --body-file and reports written', () => {
		const w = world({ closed: [80] })
		let written = ''
		const f = fake(w)
		const r = run(['sync-body', ...base, '--epic', '79', '--write'], (args) => {
			if (args[1] === 'edit') {
				expect(args.slice(0, 5)).toEqual(['issue', 'edit', '79', '--repo', R])
				expect(args[5]).toBe('--body-file')
				written = readFileSync(args[6]!, 'utf8')
				return ''
			}
			return f.gh(args)
		})
		expect(json(r).written).toBe(true)
		expect(written).toBe(json(r).body)
	})

	it('does not write when nothing changed', () => {
		const { calls, out } = sync(world(), ['--write'])
		expect(out.written).toBeUndefined()
		expect(calls.some((c) => c[1] === 'edit')).toBe(false)
	})

	it('exits 1 with a JSON error when there is no Child Issues section', () => {
		const w = world({ body: (b) => b.replace('## Child Issues', '## Kids') })
		const { r, out } = sync(w)
		expect(r.code).toBe(1)
		expect(out.error).toMatch(/Child Issues/)
	})

	it('creates the list under an empty Child Issues heading', () => {
		const w = world({ body: (b) => `## Child Issues\n\n## Done when\n\nx${b.length ? '' : b}` })
		const { out } = sync(w)
		expect(out.added).toHaveLength(11)
		expect(out.body.startsWith('## Child Issues\n\n- [ ] #80')).toBe(true)
		expect(out.body).toContain('\n\n## Done when')
	})
})

describe('check', () => {
	const check = (w: World, extra: string[] = []) => {
		const r = run(['check', ...base, '--epic', '79', ...extra], fake(w).gh)
		const out = json(r)
		return {
			r,
			status: Object.fromEntries(out.checks.map((c: any) => [c.id, c.status])) as Record<string, string>,
			checks: out.checks,
		}
	}
	const detail = (c: { checks: any[] }, id: string): string[] => c.checks.find((x) => x.id === id).detail

	it('passes the real epic 79 (board and the transferred-ref cases aside)', () => {
		const c = check(world(), ['--project', 'repobuddy bot clean up'])
		expect(c.status).toEqual({ children: 'pass', 'run-order': 'pass', graph: 'pass', board: 'pass', links: 'pass' })
		expect(c.r.code).toBe(0)
	})

	it('skips board without --project, and fails a missing board entry', () => {
		expect(check(world()).status['board']).toBe('skip')
		const w = world()
		w.children['84'].projectItems = []
		const c = check(w, ['--project', 'repobuddy bot clean up'])
		expect(c.status['board']).toBe('fail')
		expect(detail(c, 'board')).toEqual(['#84 is not on the project "repobuddy bot clean up"'])
		expect(c.r.code).toBe(1)
	})

	it('fails children on listed-but-not-native, native-but-not-listed, and counts', () => {
		const c = check(
			world({
				body: (b) => b.replace('- [ ] #84 ', '- [ ] #99 '),
			}),
		)
		expect(c.status['children']).toBe('fail')
		expect(detail(c, 'children')).toEqual([
			'#99 is listed but is not a sub-issue',
			'#84 is a sub-issue but is not listed',
		])
	})

	it('fails children on ref-less lines, matched or not', () => {
		const c = check(
			world({
				body: (b) => b.replace('- [ ] #81 ', '- [ ] ').replace('- [ ] #83 ', '- [ ] unknown thing\n- [ ] #83 '),
			}),
		)
		expect(c.status['children']).toBe('fail')
		expect(detail(c, 'children')).toEqual([
			'the line "Spike: what permissions and events does the repobuddy app need?" has no issue ref; it matches #81 (run sync-body)',
			'the line "unknown thing" has no issue ref and matches no sub-issue title',
		])
	})

	it('fails run-order when a row names a wrong blocker', () => {
		const c = check(world({ body: (b) => b.replace('| #81, #82 |', '| #81, #84 |') }))
		expect(c.status['run-order']).toBe('fail')
		expect(detail(c, 'run-order')).toEqual([
			'#83: native blocked by #82 is not in the table',
			'#83: the table lists #84, which is not a native blocker',
		])
		expect(c.r.code).toBe(1)
	})

	it('fails run-order when a wave is not after its blocker, or a child has no row', () => {
		const wave = check(world({ body: (b) => b.replace('| 3 | #83', '| 2 | #83') }))
		expect(detail(wave, 'run-order')).toEqual(['#83 (wave 2) is not after its blocker #81 (wave 2)'])
		const miss = check(world({ body: (b) => b.replace(/\| 2 \| #90 .*\n/, '') }))
		expect(detail(miss, 'run-order')).toEqual(['#90 appears in 0 table rows, expected 1'])
	})

	it('skips run-order when there is no table', () => {
		const c = check(world({ body: (b) => b.replace(/\| Wave[\s\S]*?\n\n/, '\n') }))
		expect(c.status['run-order']).toBe('skip')
	})

	it('fails graph on a cycle', () => {
		const c = check(world({ blocked: { 80: [81] } }))
		expect(c.status['graph']).toBe('fail')
		expect(detail(c, 'graph')).toEqual(['cycle: #80 -> #81 -> #80'])
	})

	describe('links', () => {
		const moved = (body: (b: string) => string) => {
			const w = world({ body })
			w.urls = { 'repobuddy/.github#57': 'https://github.com/cyberuni/.github/issues/12' }
			return check(w)
		}

		it('fails a transferred ref with no redirect note', () => {
			const c = moved((b) => b)
			expect(c.status['links']).toBe('fail')
			expect(detail(c, 'links')).toEqual([
				'#57 now resolves to cyberuni/.github#12 (transferred) and the line does not name the new ref',
			])
		})

		it('passes a transferred ref when the line names the new ref', () => {
			const c = moved((b) =>
				b
					.replace('That is #57.', 'That is #57 (now cyberuni/.github#12).')
					.replace('Related: #57,', 'Related: #57 (moved to cyberuni/.github#12),'),
			)
			expect(c.status['links']).toBe('pass')
		})

		it('fails an unresolvable ref and ignores refs in code', () => {
			const c = check(world({ body: (b) => `${b}\nSee #404 and \`#405\`.\n\`\`\`\n#406\n\`\`\`\n` }))
			expect(detail(c, 'links')).toEqual([])
			const w = world({ body: (b) => `${b}\nSee #404.\n` })
			const f = fake(w)
			const r = run(['check', ...base, '--epic', '79'], (args) =>
				args[2] === '404'
					? (() => {
							throw new Error('not found')
						})()
					: f.gh(args),
			)
			expect(json(r).checks.find((x: any) => x.id === 'links').detail).toEqual(['#404 does not resolve'])
		})
	})
})
