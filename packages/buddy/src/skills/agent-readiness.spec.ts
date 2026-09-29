import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
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
	[['bench', '--init', '--yes']],
	[['bench', '--baseline', '--task', 'a']],
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
})
