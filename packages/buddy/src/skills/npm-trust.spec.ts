import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import type { ApplyResult, PlanResult } from '../npm-trust/core.js'

const planMock = jest.fn<(options: unknown, deps: unknown) => PlanResult>()
const applyMock = jest.fn<(options: unknown, deps: unknown) => ApplyResult>()

jest.unstable_mockModule('../npm-trust/core.js', () => ({
	plan: planMock,
	apply: applyMock,
}))

const { main } = await import('./npm-trust.js')

let stdout: string[]
let stderr: string[]
let exitSpy: ReturnType<typeof jest.spyOn>

beforeEach(() => {
	planMock.mockReset()
	applyMock.mockReset()
	stdout = []
	stderr = []
	jest.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
		stdout.push(String(chunk))
		return true
	})
	jest.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
		stderr.push(String(chunk))
		return true
	})
	exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
		throw new Error(`exit:${code}`)
	}) as never)
})

afterEach(() => {
	jest.restoreAllMocks()
})

test('rejects an unknown mode with exit 2', async () => {
	// Real `process.exit(2)` terminates immediately, so the surrounding try/catch never runs; the
	// mocked exit here throws to unwind the stack, which the outer catch then treats as a thrown
	// error and reports as exit 1 too. Assert on the first exit call rather than the final rejection.
	await expect(main(['bogus'])).rejects.toThrow()
	expect(stderr.join('')).toMatch(/usage: npm-trust\.mjs/)
	expect(exitSpy.mock.calls[0]).toEqual([2])
})

test('the injected log writes to stderr only when --verbose is set', async () => {
	planMock.mockReturnValue({ ok: true, plan: 'p', total: 0, counts: {}, rows: [] })
	await main(['plan', '--org', 'acme'])
	const firstCall = planMock.mock.calls[0]
	if (!firstCall) throw new Error('expected planMock to have been called')
	const { log } = firstCall[1] as { log: (msg: string) => void }
	log('quiet')
	expect(stderr.join('')).toBe('')

	stderr = []
	planMock.mockReturnValue({ ok: true, plan: 'p', total: 0, counts: {}, rows: [] })
	await main(['plan', '--org', 'acme', '--verbose'])
	const secondCall = planMock.mock.calls[1]
	if (!secondCall) throw new Error('expected planMock to have been called twice')
	const { log: verboseLog } = secondCall[1] as { log: (msg: string) => void }
	verboseLog('loud')
	expect(stderr.join('')).toContain('loud')
})

test('plan forwards flags and prints a trimmed JSON ack', async () => {
	planMock.mockReturnValue({
		ok: true,
		plan: '.github/npm-trust-plan.json',
		total: 2,
		counts: { configure: 2 },
		rows: [],
	})
	await main(['plan', '--org', 'acme', '--file', 'release.yml', '--dir', '/repo', '--verbose'])
	expect(planMock).toHaveBeenCalledWith(
		{ package: undefined, repo: undefined, org: 'acme', allOrgs: false, file: 'release.yml', dir: '/repo' },
		{ log: expect.any(Function) },
	)
	expect(JSON.parse(stdout.join(''))).toEqual({
		ok: true,
		plan: '.github/npm-trust-plan.json',
		total: 2,
		counts: { configure: 2 },
	})
})

test('plan reads --package and --repo, and the --otp=value form for apply', async () => {
	planMock.mockReturnValue({ ok: true, plan: 'p', total: 1, counts: {}, rows: [] })
	await main(['plan', '--package', 'foo', '--repo', 'octo/repo'])
	expect(planMock).toHaveBeenCalledWith(
		expect.objectContaining({ package: 'foo', repo: 'octo/repo' }),
		expect.anything(),
	)

	applyMock.mockReturnValue({ ok: true, configured: 1, alreadyConfigured: 0, failed: 0 })
	await main(['apply', '--otp=123456'])
	expect(applyMock).toHaveBeenCalledWith({ otp: '123456', dir: undefined }, { log: expect.any(Function) })
})

test('sets allOrgs from --all-orgs', async () => {
	planMock.mockReturnValue({ ok: true, plan: 'p', total: 0, counts: {}, rows: [] })
	await main(['plan', '--all-orgs'])
	expect(planMock).toHaveBeenCalledWith(expect.objectContaining({ allOrgs: true }), expect.anything())
})

test('apply exits 1 and prints the JSON result when it fails', async () => {
	applyMock.mockReturnValue({ ok: false, configured: 0, failed: 1, stoppedOn: 'foo', reason: 'auth' })
	await expect(main(['apply', '--otp', '999999'])).rejects.toThrow()
	// The mocked `process.exit(1)` throws to unwind the stack (a real exit would terminate first),
	// which the outer catch treats as a thrown error too; only the first stdout line is the real result.
	expect(JSON.parse(stdout.join('').split('\n')[0] ?? '')).toEqual({
		ok: false,
		configured: 0,
		failed: 1,
		stoppedOn: 'foo',
		reason: 'auth',
	})
	expect(exitSpy.mock.calls[0]).toEqual([1])
})

test('catches a thrown error, prints JSON on stdout, and exits 1', async () => {
	planMock.mockImplementation(() => {
		throw new Error('scope required: --package <name> | --repo <owner/name> | --org <login> | --all-orgs')
	})
	await expect(main(['plan'])).rejects.toThrow('exit:1')
	expect(JSON.parse(stdout.join(''))).toEqual({ ok: false, error: expect.stringContaining('scope required') })
	expect(exitSpy).toHaveBeenCalledWith(1)
})

test('stringifies a non-Error thrown value', async () => {
	planMock.mockImplementation(() => {
		throw 'boom'
	})
	await expect(main(['plan'])).rejects.toThrow('exit:1')
	expect(JSON.parse(stdout.join(''))).toEqual({ ok: false, error: 'boom' })
})

test('defaults argv to process.argv.slice(2)', async () => {
	const original = process.argv
	process.argv = ['node', 'buddy', 'plan', '--org', 'acme']
	try {
		planMock.mockReturnValue({ ok: true, plan: 'p', total: 0, counts: {}, rows: [] })
		await main()
		expect(planMock).toHaveBeenCalledWith(expect.objectContaining({ org: 'acme' }), expect.anything())
	} finally {
		process.argv = original
	}
})
