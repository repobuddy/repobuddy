import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { AREA_WEIGHTS } from './score.js'
import {
	COMPARISONS_DIR,
	findComparisons,
	formatSuggestions,
	loadComparison,
	readEffects,
	SuggestError,
	suggest,
	suggestArea,
} from './suggest.js'

let dir: string
let n: number

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'agent-readiness-suggest-'))
	n = 0
})

afterEach(() => rmSync(dir, { recursive: true, force: true }))

const side = (mean: number, size = 10) => ({ n: size, mean, median: mean, min: mean, max: mean })

/** A pass row: before and after pass rates, significant unless `p` says otherwise. */
function passRow(task: string, before: number, after: number, p = 0.01, tooFew = false) {
	return { scope: 'task', task, metric: 'pass', before: side(before), after: side(after), change: null, p, tooFew }
}

function pooled(metric: string, change: number, p = 0.01, tooFew = false) {
	return { scope: 'pooled', metric, ratio: 1 + change, change, tasks: 3, p, tooFew }
}

function record(rows: object[], over: Record<string, unknown> = {}) {
	return {
		schemaVersion: 3,
		kind: 'comparison',
		suite: 'repobuddy.readiness',
		createdAt: `2026-10-0${++n}T00:00:00.000Z`,
		tags: { area: 'noise' },
		verdict: 'improved',
		incomparable: [],
		unmatched: [],
		rows,
		...over,
	}
}

function write(rec: object, name = `compare-${++n}.json`) {
	const path = join(dir, COMPARISONS_DIR, name)
	mkdirSync(join(dir, COMPARISONS_DIR), { recursive: true })
	writeFileSync(path, JSON.stringify(rec))
	return path
}

const effects = (rows: object[]) => readEffects('x.json', loadComparison(write(record(rows))))

describe('readEffects', () => {
	it('reads a pass effect from significant task rows', () => {
		expect(effects([passRow('a', 0.5, 0.9)]).pass).toBe(1)
		expect(effects([passRow('a', 0.9, 0.5)]).pass).toBe(-1)
	})

	it('ignores a pass row that is not significant or cannot be', () => {
		const e = effects([passRow('a', 0.5, 0.9, 0.2), passRow('b', 0.5, 0.9, 0.01, true)])
		expect(e.pass).toBeUndefined()
		expect(e.notes).toEqual(['too few runs to call any change'])
	})

	it('reads no direction from pass rates that moved both ways', () => {
		const e = effects([passRow('a', 0.5, 0.9), passRow('b', 0.9, 0.5)])
		expect(e.pass).toBeUndefined()
		expect(e.notes).toContain('pass rate rose on one task and fell on another')
	})

	it('reads an effort effect from pooled token and turn rows', () => {
		expect(effects([pooled('outputTokens', -0.08), pooled('turns', -0.1)]).effort).toBe(1)
		expect(effects([pooled('inputTokens', 0.2)]).effort).toBe(-1)
		const mixed = effects([pooled('outputTokens', -0.08), pooled('toolCalls', 0.1)])
		expect(mixed.effort).toBeUndefined()
		expect(mixed.notes).toContain('pooled token and turn rows moved in opposite directions')
	})

	it('never lets dollars or wall time decide, but shows the cost row', () => {
		const e = effects([pooled('costUsd', -0.3, 0.001), pooled('wallMs', -0.3, 0.001), pooled('cacheReadTokens', -0.3)])
		expect(e.effort).toBeUndefined()
		expect(e.cost).toEqual({ change: -0.3, p: 0.001 })
		expect(e.notes).toEqual(['no significant change in pass rate or effort'])
	})

	it('records the smallest run count', () => {
		expect(effects([passRow('a', 0.5, 0.9)]).runs).toBe(10)
	})
})

describe('suggestArea', () => {
	const ev = (pass?: 1 | -1, effort?: 1 | -1) => ({
		file: 'f',
		createdAt: 'c',
		verdict: 'v',
		notes: [],
		rows: [],
		...(pass ? { pass } : {}),
		...(effort ? { effort } : {}),
	})

	it('raises by one step on a replicated effect', () => {
		expect(suggestArea('noise', 15, [ev(1), ev(1)])).toMatchObject({ suggested: 20, line: '- noise: 20' })
		expect(suggestArea('noise', 15, [ev(undefined, 1), ev(undefined, 1)])).toMatchObject({ suggested: 20 })
	})

	it('lowers by one step on a replicated harm', () => {
		expect(suggestArea('noise', 15, [ev(-1), ev(-1)]).suggested).toBe(10)
	})

	it('moves one bounded step even when pass rate and effort agree', () => {
		expect(suggestArea('noise', 15, [ev(1, 1), ev(1, 1)]).suggested).toBe(20)
	})

	it('keeps the weight on a single record', () => {
		const s = suggestArea('noise', 15, [ev(1, 1)])
		expect(s.suggested).toBeUndefined()
		expect(s.line).toBeUndefined()
		expect(s.reason).toBe(
			'keep the weight: no replicated effect (pass rate: one record, not replicated; effort: one record, not replicated)',
		)
	})

	it('keeps the weight when records disagree, as the first pilot did', () => {
		expect(suggestArea('noise', 15, [ev(undefined, 1), ev(undefined, -1), ev(undefined, 1)]).reason).toMatch(
			/no replicated effect .*effort: 2 record\(s\) helped, 1 hurt/,
		)
	})

	it('keeps the weight when replicated pass and effort effects cancel', () => {
		expect(suggestArea('noise', 15, [ev(1, -1), ev(1, -1)]).reason).toMatch(
			/^keep the weight: the replicated effects disagree/,
		)
	})

	it('keeps the weight on a null result', () => {
		expect(suggestArea('noise', 15, [ev(), ev()]).reason).toBe(
			'keep the weight: no replicated effect (pass rate: no effect; effort: no effect)',
		)
	})

	it('clamps to 0-40', () => {
		expect(suggestArea('verification', 38, [ev(1), ev(1)]).suggested).toBe(40)
		expect(suggestArea('verification', 40, [ev(1), ev(1)]).reason).toMatch(/^keep the weight: already at the maximum/)
		expect(suggestArea('task-discovery', 0, [ev(-1), ev(-1)]).reason).toMatch(/already at the minimum/)
		expect(suggestArea('task-discovery', 3, [ev(-1), ev(-1)]).suggested).toBe(0)
	})
})

describe('suggest', () => {
	it('groups records by their area tag and skips what it cannot count', () => {
		const files = [
			write(record([pooled('outputTokens', -0.1)])),
			write(record([pooled('outputTokens', -0.07)])),
			write(record([passRow('a', 0.5, 0.9)], { tags: { area: 'verification' } })),
			write(record([], { tags: {} })),
			write(record([], { tags: { area: 'security' } })),
			write(record([], { suite: 'other' })),
			write(record([], { verdict: 'incomparable', incomparable: [{ message: 'model differs' }] })),
		]
		const result = suggest(files, { ...AREA_WEIGHTS, noise: 10 })
		expect(result.suggestions.map((s) => [s.area, s.current, s.suggested])).toEqual([
			['verification', 25, undefined],
			['noise', 10, 15],
		])
		expect(result.skipped.map((s) => s.reason)).toEqual([
			'no area tag',
			'area "security" carries no weight',
			'suite other, not repobuddy.readiness',
			'incomparable: model differs',
		])
	})

	it('reports an asked-for area with no records as keep', () => {
		const result = suggest([write(record([pooled('turns', -0.1)]))], AREA_WEIGHTS, 'environment')
		expect(result.suggestions).toEqual([
			{
				area: 'environment',
				current: 10,
				reason: 'keep the weight: no replicated effect (pass rate: no effect; effort: no effect)',
				evidence: [],
			},
		])
	})

	it('refuses a record of another schema version, or one that is not a comparison', () => {
		expect(() => suggest([write(record([], { schemaVersion: 4 }))], AREA_WEIGHTS)).toThrow(
			/schema version 4; this version of the script reads 3 only/,
		)
		expect(() => suggest([write({ schemaVersion: 3, runs: [] })], AREA_WEIGHTS)).toThrow(SuggestError)
		expect(() => suggest([write(record([], { rows: undefined }))], AREA_WEIGHTS)).toThrow(/has no rows/)
		const bad = join(dir, 'bad.json')
		writeFileSync(bad, '{')
		expect(() => suggest([bad], AREA_WEIGHTS)).toThrow(/not readable JSON/)
	})
})

it('finds the comparison records, oldest first, and nothing else', () => {
	expect(findComparisons(dir)).toEqual([])
	write(record([]), 'compare-2026-10-02.json')
	write(record([]), 'compare-2026-10-01.json')
	write(record([]), '2026-10-01.after.json')
	expect(findComparisons(dir).map((f) => f.slice(-15))).toEqual(['2026-10-01.json', '2026-10-02.json'])
})

describe('formatSuggestions', () => {
	it('prints the override line, its evidence, and where it goes', () => {
		const files = [
			write(record([pooled('outputTokens', -0.1, 0.0004), pooled('costUsd', -0.06, 0.008)]), 'compare-a.json'),
			write(record([pooled('outputTokens', -0.07, 0.02), passRow('fix', 0.8, 1)]), 'compare-b.json'),
		]
		expect(formatSuggestions(suggest(files, AREA_WEIGHTS))).toBe(
			[
				'noise (weight 15): 20, raise by 5 (pass rate: one record, not replicated; pooled effort fell in 2 records)',
				'  - compare-a.json: improved; pooled outputTokens -10% (p <0.001); cost -6% (p 0.008), not deciding',
				'  - compare-b.json: improved, 10 runs a side; fix pass 80% → 100% (p 0.01), pooled outputTokens -7% (p 0.02)',
				'',
				'To apply, add to the `## Weights` section of .agents/references/repobuddy.readiness.md (frontmatter `merge: merge-sections`):',
				'',
				'- noise: 20',
				'',
				'Put the evidence above in the pull request that adds the override. Defaults change only on results across repos.',
				'',
			].join('\n'),
		)
	})

	it('says how to tag when nothing is tagged, and lists what it skipped', () => {
		expect(formatSuggestions(suggest([write(record([], { tags: {} }), 'compare-x.json')], AREA_WEIGHTS))).toBe(
			'No comparison of suite repobuddy.readiness is tagged with an area. Compare with `--tag area=<area>` to get a suggestion.\nskipped compare-x.json: no area tag\n',
		)
	})

	it('prints a keep with its notes', () => {
		const out = formatSuggestions(suggest([write(record([pooled('turns', 0.1, 0.4)]), 'compare-k.json')], AREA_WEIGHTS))
		expect(out).toBe(
			'noise (weight 15): keep the weight: no replicated effect (pass rate: no effect; effort: no effect)\n  - compare-k.json: improved; no significant change in pass rate or effort\n',
		)
	})
})
