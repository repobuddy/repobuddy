import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'
import { main } from './agent-readiness.js'

let stdout: string[]
let stderr: string[]
let dir: string

beforeEach(() => {
	stdout = []
	stderr = []
	dir = mkdtempSync(join(tmpdir(), 'agent-readiness-cli-'))
	writeFileSync(join(dir, 'README.md'), '# x')
	writeFileSync(join(dir, 'package.json'), '{}')
	jest.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
		stdout.push(String(chunk))
		return true
	})
	jest.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
		stderr.push(String(chunk))
		return true
	})
	jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
		throw new Error(`exit:${code}`)
	}) as never)
})

afterEach(() => {
	jest.restoreAllMocks()
	rmSync(dir, { recursive: true, force: true })
})

test.each([
	[[]],
	[['bogus']],
	[['score', '--dir']],
	[['score', '--nope']],
	[['score', '--package']],
	[['score', '--dir', '.', '--package', '.']],
	[['score', '--baseline']],
	[['score', '--ref', 'HEAD']],
	[['score', '--check', '--min-level']],
	[['score', '--check', '--min-level', '0']],
	[['score', '--check', '--min-level', '6']],
	[['score', '--package', '.', '--check', '--min-level', '5']],
	[['score', '--check', '--min-level', '2.5']],
	[['score', '--min-level', '2']],
	[['score', '--package', '.', '--run-knip']],
	[['score', '--runner', 'print']],
	[['bench', 'convert']],
	[['bench', 'convert', 'a.json']],
	[['bench', 'convert', 'a.json', 'b.json', '--arm', 'before']],
	[['bench', 'convert', 'a.json', '--arm']],
	[['bench', 'convert', 'a.json', '--arm', 'before', '--yes']],
	[['suggest', '--area', 'security']],
	[['suggest', '--area']],
	[['suggest', '--yes']],
])('rejects bad usage %j with exit 2', async (argv) => {
	await expect(main(argv)).rejects.toThrow('exit:2')
	expect(stderr.join('')).toMatch(/usage: agent-readiness\.mjs score/)
})

test('prints the human report', async () => {
	await main(['score', '--dir', dir])
	expect(stdout.join('')).toMatch(/^Level 1 of 5: An agent can read it/)
})

test('prints JSON with --json', async () => {
	await main(['score', '--dir', dir, '--json'])
	const result = JSON.parse(stdout.join(''))
	expect(result.level).toBe(1)
	expect(result.weights.verification).toBe(25)
})

test('scores a package with --package', async () => {
	await main(['score', '--package', dir])
	expect(stdout.join('')).toMatch(/^Package \(unnamed\): level 0 of 4: An agent cannot find its way in/)
})

test('prints the package result as JSON with --package --json', async () => {
	await main(['score', '--package', dir, '--json'])
	const result = JSON.parse(stdout.join(''))
	expect(result.level).toBe(0)
	expect(result.weights.api).toBe(30)
})

test('--check exits 1 below the default minimum level of 3', async () => {
	await expect(main(['score', '--dir', dir, '--check'])).rejects.toThrow('exit:1')
	expect(stdout.join('')).toMatch(/check: FAIL, level 1 is below --min-level 3\n$/)
})

test('--check exits 0 at or above --min-level', async () => {
	await main(['score', '--dir', dir, '--check', '--min-level', '1'])
	expect(stdout.join('')).toMatch(/check: ok, level 1 meets --min-level 1\n$/)
})

test('--check --json adds the check result', async () => {
	await expect(main(['score', '--dir', dir, '--check', '--min-level', '2', '--json'])).rejects.toThrow('exit:1')
	const result = JSON.parse(stdout.join(''))
	expect(result.check).toEqual({ minLevel: 2, passed: false, provisional: [] })
})

test('--run-knip leaves dead-code n/a in a repo without knip', async () => {
	await main(['score', '--dir', dir, '--run-knip', '--json'])
	const result = JSON.parse(stdout.join(''))
	expect(result.checks.find((c: { id: string }) => c.id === 'dead-code').status).toBe('n/a')
})

test('applies the repo weight override from the reference', async () => {
	mkdirSync(join(dir, '.agents/references'), { recursive: true })
	writeFileSync(
		join(dir, '.agents/references/repobuddy.readiness.md'),
		'---\nmerge: merge-sections\n---\n\n## Weights\n\n- noise: 30\n',
	)
	await main(['score', '--dir', dir, '--json'])
	const result = JSON.parse(stdout.join(''))
	expect(result.weights).toMatchObject({ noise: 30, verification: 25 })
	expect(result.overriddenWeights).toEqual(['noise'])
	expect(stderr.join('')).toBe('')
})

test('reads the deprecated weights.json with a warning on stderr', async () => {
	mkdirSync(join(dir, '.agents/readiness'), { recursive: true })
	writeFileSync(join(dir, '.agents/readiness/weights.json'), '{ "noise": 30 }')
	await main(['score', '--dir', dir, '--json'])
	expect(JSON.parse(stdout.join('')).overriddenWeights).toEqual(['noise'])
	expect(stderr.join('')).toMatch(
		/weights\.json is deprecated[\s\S]*\.agents\/references\/repobuddy\.readiness\.md[\s\S]*- noise: 30/,
	)
})

test('exits 2 on a malformed config', async () => {
	mkdirSync(join(dir, '.agents/readiness'), { recursive: true })
	writeFileSync(join(dir, '.agents/readiness/weights.json'), '{ "bogus": 1 }')
	await expect(main(['score', '--dir', dir])).rejects.toThrow('exit:2')
	expect(stderr.join('')).toMatch(/unknown area "bogus"/)
})

test('--check holds a package at --min-level too', async () => {
	await expect(main(['score', '--package', dir, '--check', '--min-level', '1'])).rejects.toThrow('exit:1')
	expect(stdout.join('')).toMatch(/check: FAIL, level 0 is below --min-level 1\n$/)
})

describe('suggest', () => {
	const comparison = (change: number) => ({
		schemaVersion: 3,
		kind: 'comparison',
		suite: 'repobuddy.readiness',
		createdAt: '2026-10-05T00:00:00.000Z',
		tags: { area: 'noise' },
		verdict: 'improved',
		incomparable: [],
		rows: [{ scope: 'pooled', metric: 'outputTokens', change, p: 0.01, tooFew: false }],
	})
	const store = (name: string, change: number) => {
		const folder = join(dir, '.agents/aced/results/bench/repobuddy.readiness')
		mkdirSync(folder, { recursive: true })
		writeFileSync(join(folder, name), JSON.stringify(comparison(change)))
		return join(folder, name)
	}

	test('suggests from the stored comparisons against the repo override, and writes nothing', async () => {
		store('compare-1.json', -0.1)
		store('compare-2.json', -0.08)
		mkdirSync(join(dir, '.agents/references'), { recursive: true })
		writeFileSync(
			join(dir, '.agents/references/repobuddy.readiness.md'),
			'---\nmerge: merge-sections\n---\n\n## Weights\n\n- noise: 40\n',
		)
		await main(['suggest', '--dir', dir])
		expect(stdout.join('')).toMatch(/^noise \(weight 40\): keep the weight: already at the maximum/)
		stdout = []
		await main(['suggest', '--dir', dir, '--area', 'noise', '--json', store('compare-3.json', -0.1)])
		expect(JSON.parse(stdout.join('')).suggestions[0]).toMatchObject({ area: 'noise', current: 40 })
	})

	test('prints the override line', async () => {
		store('compare-1.json', -0.1)
		store('compare-2.json', -0.08)
		await main(['suggest', '--dir', dir])
		expect(stdout.join('')).toMatch(/raise by 5[\s\S]*\n- noise: 20\n/)
	})

	test('exits 1 on a record it cannot read', async () => {
		writeFileSync(join(dir, 'x.json'), '{}')
		await expect(main(['suggest', '--dir', dir, join(dir, 'x.json')])).rejects.toThrow('exit:1')
		expect(stderr.join('')).toMatch(/not an ACED comparison record/)
	})

	test('exits 2 on a malformed weights override', async () => {
		mkdirSync(join(dir, '.agents/readiness'), { recursive: true })
		writeFileSync(join(dir, '.agents/readiness/weights.json'), '{ "bogus": 1 }')
		await expect(main(['suggest', '--dir', dir])).rejects.toThrow('exit:2')
	})
})

test('--min-level accepts 5 for a repo, the level a fresh bench baseline unlocks', async () => {
	await expect(main(['score', '--dir', dir, '--check', '--min-level', '5'])).rejects.toThrow('exit:1')
	expect(stdout.join('')).toMatch(/check: FAIL, level 1 is below --min-level 5\n$/)
})

test('bench hands over to ACED and exits 1', async () => {
	await expect(main(['bench', '--dir', dir, '--baseline'])).rejects.toThrow('exit:1')
	expect(stderr.join('')).toMatch(/moved to ACED[\s\S]*aced-bench plan --suite repobuddy\.readiness/)
	expect(stderr.join('')).not.toMatch(/git mv/)
	stderr = []
	mkdirSync(join(dir, '.agents/readiness/bench'), { recursive: true })
	await expect(main(['bench', 'compare', 'a.json', 'b.json', '--dir', dir])).rejects.toThrow('exit:1')
	expect(stderr.join('')).toMatch(/git mv \.agents\/readiness\/bench \.agents\/aced\/bench\/repobuddy\.readiness/)
})

test('bench convert writes a version-3 record of a version-2 results file', async () => {
	const taskSet = join(dir, 'suite')
	mkdirSync(taskSet)
	writeFileSync(join(taskSet, 'tasks.json'), '{"tasks":[]}')
	const run = {
		task: 'a',
		run: 1,
		pass: true,
		wallMs: 1000,
		inputTokens: 100,
		outputTokens: 50,
		cacheReadTokens: 0,
		cacheCreationTokens: 0,
		turns: 3,
		toolCalls: 2,
		costUsd: 0.1,
		capped: false,
	}
	const results = join(dir, 'before.json')
	writeFileSync(
		results,
		JSON.stringify({
			schemaVersion: 2,
			createdAt: '2026-10-03T00:00:00.000Z',
			commit: 'abc',
			taskSetCommit: 'def',
			model: 'sonnet',
			harness: 'claude-code',
			runner: 'print',
			runsPerTask: 1,
			summary: { tasks: [] },
			results: [run],
		}),
	)
	await main(['bench', 'convert', results, '--arm', 'before', '--task-set', taskSet])
	expect(JSON.parse(stdout.join(''))).toMatchObject({ schemaVersion: 3, suite: 'repobuddy.readiness', arm: 'before' })
	const out = join(dir, 'before.v3.json')
	await main(['bench', 'convert', results, '--arm', 'before', '--task-set', taskSet, '--out', out])
	expect(existsSync(out)).toBe(true)

	await expect(main(['bench', 'convert', results, '--arm', 'before', '--task-set', join(dir, 'none')])).rejects.toThrow(
		'exit:1',
	)
	expect(stderr.join('')).toMatch(/tasks\.json does not exist/)
})
