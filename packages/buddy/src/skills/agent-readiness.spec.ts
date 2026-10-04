import { spawnSync } from 'node:child_process'
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
	[['bench', '--package', '.']],
	[['bench', '--runs', '0']],
	[['bench', '--task']],
	[['bench', '--ref']],
	[['score', '--ref', 'HEAD']],
	[['bench', '--init', '--yes']],
	[['bench', '--baseline', '--task', 'a']],
	[['score', '--check', '--min-level']],
	[['score', '--check', '--min-level', '0']],
	[['score', '--check', '--min-level', '6']],
	[['score', '--package', '.', '--check', '--min-level', '5']],
	[['bench', '--check']],
	[['score', '--check', '--min-level', '2.5']],
	[['score', '--min-level', '2']],
	[['score', '--package', '.', '--run-knip']],
	[['bench', '--run-knip']],
	[['bench', '--runner', 'bogus']],
	[['score', '--runner', 'print']],
	[['bench', 'compare']],
	[['bench', 'compare', 'a.json']],
	[['bench', 'compare', 'a.json', 'b.json', 'c.json']],
	[['bench', 'compare', 'a.json', 'b.json', '--yes']],
])('rejects bad usage %j with exit 2', async (argv) => {
	await expect(main(argv)).rejects.toThrow('exit:2')
	expect(stderr.join('')).toMatch(/usage: agent-readiness\.mjs score/)
})

test('bench exits 1 when the repo has no task set', async () => {
	await expect(main(['bench', '--dir', dir])).rejects.toThrow('exit:1')
	expect(stderr.join('')).toMatch(/bench --init/)
})

test('bench --init writes a task set, and without --yes bench only prints the plan', async () => {
	await main(['bench', '--dir', dir, '--init'])
	expect(stdout.join('')).toMatch(/^Wrote \.agents\/readiness\/bench\/tasks\.json/)
	stdout = []
	await main(['bench', '--dir', dir, '--runs', '2', '--task', 'small-feature'])
	expect(stdout.join('')).toMatch(/^Bench plan: 1 task\(s\) × 2 run\(s\)[\s\S]*Nothing has run/)
	stdout = []
	await main(['bench', '--dir', dir, '--json'])
	expect(JSON.parse(stdout.join('')).plan.totalRuns).toBe(9)
	expect(existsSync(join(dir, '.agents/readiness/bench/results'))).toBe(false)
})

describe('bench --runner interactive', () => {
	const saved = { ...process.env }
	afterEach(() => {
		process.env = { ...saved }
	})
	beforeEach(async () => {
		delete process.env['CLAUDE_CODE_OAUTH_TOKEN']
		delete process.env['ANTHROPIC_API_KEY']
		await main(['bench', '--dir', dir, '--init'])
		stdout = []
	})

	test('exits 1 outside a terminal multiplexer, before planning', async () => {
		process.env['CYBER_MUX'] = 'none'
		await expect(main(['bench', '--dir', dir, '--runner', 'interactive'])).rejects.toThrow('exit:1')
		expect(stderr.join('')).toMatch(/none was found: run the bench from inside tmux or herdr/)
		expect(stdout.join('')).toBe('')
	})

	test('exits 1 without a credential for the isolated session', async () => {
		process.env['CYBER_MUX'] = 'tmux'
		await expect(main(['bench', '--dir', dir, '--runner', 'interactive'])).rejects.toThrow('exit:1')
		expect(stderr.join('')).toMatch(/claude setup-token/)
	})

	test('plans with the interactive runner and runs nothing', async () => {
		process.env['CYBER_MUX'] = 'tmux'
		process.env['CLAUDE_CODE_OAUTH_TOKEN'] = 't'
		await main(['bench', '--dir', dir, '--runner', 'interactive', '--json'])
		expect(JSON.parse(stdout.join('')).plan.runner).toBe('interactive')
	})
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

test('bench --yes runs the task set and reports each run', async () => {
	spawnSync('git', ['init', '-q'], { cwd: dir })
	spawnSync('git', ['add', '-A'], { cwd: dir })
	spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-qm', 'init'], { cwd: dir })
	mkdirSync(join(dir, '.agents/readiness/bench'), { recursive: true })
	// A setup that fails stops each run before the agent starts, so nothing is spent.
	writeFileSync(
		join(dir, '.agents/readiness/bench/tasks.json'),
		JSON.stringify({ runs: 1, setup: 'false', tasks: [{ id: 'a', prompt: 'p', check: 'true' }] }),
	)
	await main(['bench', '--dir', dir, '--yes'])
	expect(stderr.join('')).toMatch(/^a #1: error: setup failed: false, \$0\.00\n/)
	expect(stdout.join('')).toMatch(/^Bench: 0\/1 passed/)
	stdout = []
	await main(['bench', '--dir', dir, '--yes', '--baseline', '--json'])
	expect(JSON.parse(stdout.join('')).baselinePath).toBe('.agents/readiness/bench/baseline.json')
	stdout = []
	await main(['bench', '--dir', dir, '--ref', 'HEAD', '--json'])
	expect(JSON.parse(stdout.join('')).plan).toMatchObject({ ref: 'HEAD' })
	await expect(main(['bench', '--dir', dir, '--ref', 'nope'])).rejects.toThrow('exit:1')
	expect(stderr.join('')).toMatch(/--ref "nope" names no commit/)
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

test('applies the repo weight override', async () => {
	mkdirSync(join(dir, '.agents/readiness'), { recursive: true })
	writeFileSync(join(dir, '.agents/readiness/weights.json'), '{ "noise": 30 }')
	await main(['score', '--dir', dir, '--json'])
	const result = JSON.parse(stdout.join(''))
	expect(result.weights.noise).toBe(30)
	expect(result.overriddenWeights).toEqual(['noise'])
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

test('--min-level accepts 5 for a repo, the level a fresh bench baseline unlocks', async () => {
	await expect(main(['score', '--dir', dir, '--check', '--min-level', '5'])).rejects.toThrow('exit:1')
	expect(stdout.join('')).toMatch(/check: FAIL, level 1 is below --min-level 5\n$/)
})

test('bench compare compares two stored results and runs nothing', async () => {
	const results = (costs: number[]) =>
		costs.map((costUsd, i) => ({
			task: 'a',
			run: i + 1,
			pass: true,
			wallMs: 1000,
			inputTokens: 100,
			outputTokens: 50,
			cacheReadTokens: 0,
			cacheCreationTokens: 0,
			turns: 3,
			toolCalls: 2,
			costUsd,
			capped: false,
		}))
	const write = (name: string, costs: number[]) => {
		const rs = results(costs)
		const summary = {
			tasks: [{ task: 'a', runs: rs.length, passes: rs.length, passRate: 1, capped: 0, errors: 0, totalCostUsd: 0 }],
			passRate: 1,
		}
		const record = {
			createdAt: name,
			commit: 'x',
			model: 'sonnet',
			harness: 'claude-code',
			runsPerTask: 5,
			summary,
			results: rs,
		}
		writeFileSync(join(dir, `${name}.json`), JSON.stringify(record))
		return join(dir, `${name}.json`)
	}
	const before = write('before', [1, 2, 3, 4, 5])
	const after = write('after', [6, 7, 8, 9, 10])
	await main(['bench', 'compare', before, after])
	expect(stdout.join('')).toMatch(
		/^Bench compare: .*before\.json → .*after\.json\n[\s\S]*cost: mean \+167%[\s\S]*p 0\.008 \*/,
	)
	stdout = []
	await main(['bench', 'compare', before, after, '--json'])
	expect(JSON.parse(stdout.join('')).comparison.tasks[0].task).toBe('a')

	await expect(main(['bench', 'compare', before, join(dir, 'missing.json')])).rejects.toThrow('exit:1')
	expect(stderr.join('')).toMatch(/missing\.json does not exist/)
})
