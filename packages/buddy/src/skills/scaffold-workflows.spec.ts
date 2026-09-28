import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import type { ScaffoldWorkflowsResult } from '../setup-github-repo/scaffold-workflows.js'

const scaffoldWorkflowsMock = jest.fn<(options: unknown) => Promise<ScaffoldWorkflowsResult>>()

jest.unstable_mockModule('../setup-github-repo/scaffold-workflows.js', () => ({
	scaffoldWorkflows: scaffoldWorkflowsMock,
}))

const { main } = await import('./scaffold-workflows.js')

let stdout: string[]
let stderr: string[]
let exitSpy: ReturnType<typeof jest.spyOn>

beforeEach(() => {
	scaffoldWorkflowsMock.mockReset()
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

test('rejects unknown arguments and missing flag values with exit 1', async () => {
	await expect(main(['--bogus'])).rejects.toThrow('exit:1')
	await expect(main(['--state'])).rejects.toThrow('exit:1')
	await expect(main(['--dir'])).rejects.toThrow('exit:1')
	await expect(main(['--workflows'])).rejects.toThrow('exit:1')
})

test('forwards flags and prints the JSON result', async () => {
	scaffoldWorkflowsMock.mockResolvedValue({ ok: true, created: ['.github/workflows/codeql.yml'], skipped: [] })
	await main(['--state', '/tmp/s.json', '--dir', '/repo', '--workflows', 'codeql', '--yes', '--verbose'])
	expect(scaffoldWorkflowsMock).toHaveBeenCalledWith({
		statePath: '/tmp/s.json',
		dir: '/repo',
		workflows: 'codeql',
		yes: true,
		log: expect.any(Function),
	})
	expect(JSON.parse(stdout.join(''))).toEqual({ ok: true, created: ['.github/workflows/codeql.yml'], skipped: [] })
})

test('accepts -y as a shorthand for --yes', async () => {
	scaffoldWorkflowsMock.mockResolvedValue({ ok: true, created: [], skipped: [] })
	await main(['-y'])
	expect(scaffoldWorkflowsMock).toHaveBeenCalledWith(expect.objectContaining({ yes: true }))
})

test('omits the log function without --verbose', async () => {
	scaffoldWorkflowsMock.mockResolvedValue({ ok: true, created: [], skipped: [] })
	await main([])
	expect(scaffoldWorkflowsMock).toHaveBeenCalledWith({})
})

test('reports a thrown error on stderr and exits 1', async () => {
	scaffoldWorkflowsMock.mockRejectedValue(new Error('State file not found: /tmp/s.json'))
	await expect(main([])).rejects.toThrow('exit:1')
	expect(stderr.join('')).toContain('State file not found')
	expect(exitSpy).toHaveBeenCalledWith(1)
})

test('stringifies a non-Error rejection', async () => {
	scaffoldWorkflowsMock.mockRejectedValue('boom')
	await expect(main([])).rejects.toThrow('exit:1')
	expect(stderr.join('')).toContain('boom')
})
