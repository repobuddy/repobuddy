import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import type { DetectStateResult } from '../setup-github-repo/detect-state.js'

const detectStateMock = jest.fn<(options: unknown) => DetectStateResult>()

jest.unstable_mockModule('../setup-github-repo/detect-state.js', () => ({
	detectState: detectStateMock,
}))

const { main } = await import('./detect-state.js')

let stdout: string[]
let stderr: string[]
let exitSpy: ReturnType<typeof jest.spyOn>

beforeEach(() => {
	detectStateMock.mockReset()
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

test('rejects unknown arguments with exit 1', async () => {
	await expect(main(['--bogus'])).rejects.toThrow('exit:1')
	expect(stderr.join('')).toMatch(/unknown argument/)
	expect(exitSpy).toHaveBeenCalledWith(1)
})

test('rejects --dir/--out with no value', async () => {
	await expect(main(['--dir'])).rejects.toThrow('exit:1')
	await expect(main(['--out'])).rejects.toThrow('exit:1')
})

test('parses --dir and --out and forwards them, printing the JSON ack', async () => {
	const result: DetectStateResult = {
		ack: {
			ok: true,
			artifact: '/tmp/state.json',
			repo: 'octo/repo',
			defaultBranch: 'main',
			counts: { willSet: 1, alreadySet: 7 },
		},
		state: {
			repo: 'octo/repo',
			defaultBranch: 'main',
			current: {} as never,
			detected: {
				language: null,
				codeqlLanguage: null,
				packageManager: null,
				hasPackageJson: false,
				hasDependabotConfig: false,
				existingWorkflows: [],
			},
			rows: [{ setting: 'x', current: 'a', target: 'b', action: 'will set' }],
		},
	}
	detectStateMock.mockReturnValue(result)
	await main(['--dir', '/repo', '--out', '/tmp/state.json'])
	expect(detectStateMock).toHaveBeenCalledWith({ dir: '/repo', out: '/tmp/state.json' })
	expect(JSON.parse(stdout.join(''))).toEqual(result.ack)
})

test('prints a verbose table on stderr with --verbose', async () => {
	const result: DetectStateResult = {
		ack: {
			ok: true,
			artifact: '/tmp/state.json',
			repo: 'octo/repo',
			defaultBranch: 'main',
			counts: { willSet: 1, alreadySet: 0 },
		},
		state: {
			repo: 'octo/repo',
			defaultBranch: 'main',
			current: {} as never,
			detected: {
				language: 'typescript',
				codeqlLanguage: 'javascript',
				packageManager: 'pnpm',
				hasPackageJson: true,
				hasDependabotConfig: false,
				existingWorkflows: ['ci.yml'],
			},
			rows: [{ setting: 'x', current: 'a', target: 'b', action: 'will set' }],
		},
	}
	detectStateMock.mockReturnValue(result)
	await main(['--verbose'])
	const out = stderr.join('')
	expect(out).toContain('Repo: octo/repo')
	expect(out).toContain('typescript')
	expect(out).toContain('ci.yml')
	expect(out).toContain('State written to /tmp/state.json')
})

test('reports a thrown error on stderr and exits 1', async () => {
	detectStateMock.mockImplementation(() => {
		throw new Error('gh not found')
	})
	await expect(main([])).rejects.toThrow('exit:1')
	expect(stderr.join('')).toContain('gh not found')
})

test('stringifies a non-Error thrown value', async () => {
	detectStateMock.mockImplementation(() => {
		throw 'boom'
	})
	await expect(main([])).rejects.toThrow('exit:1')
	expect(stderr.join('')).toContain('boom')
})

test('verbose output falls back to "unknown"/"none" when nothing was detected', async () => {
	const result: DetectStateResult = {
		ack: {
			ok: true,
			artifact: '/tmp/state.json',
			repo: 'octo/repo',
			defaultBranch: 'main',
			counts: { willSet: 0, alreadySet: 0 },
		},
		state: {
			repo: 'octo/repo',
			defaultBranch: 'main',
			current: {} as never,
			detected: {
				language: null,
				codeqlLanguage: null,
				packageManager: null,
				hasPackageJson: false,
				hasDependabotConfig: false,
				existingWorkflows: [],
			},
			rows: [{ setting: 'x', current: 'a', target: 'b', action: 'will set' }],
		},
	}
	detectStateMock.mockReturnValue(result)
	await main(['--verbose'])
	const out = stderr.join('')
	expect(out).toContain('Language:        unknown')
	expect(out).toContain('CodeQL language: unknown')
	expect(out).toContain('Package manager: none')
	expect(out).toContain('Existing workflows: none')
})
