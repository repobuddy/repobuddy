import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import type { CheckpointList } from '../checkpoint/list.js'

const listMock = jest.fn<(options: unknown) => CheckpointList>()
const writeMock = jest.fn<(options: unknown) => string>()
const markMock = jest.fn<(options: unknown) => { path: string; at: string }>()

class NotARepoError extends Error {}
class InvalidCheckpointError extends Error {}
jest.unstable_mockModule('../checkpoint/list.js', () => ({
	listCheckpoints: listMock,
	formatList: (list: CheckpointList) => `rows:${list.checkpoints.length}\n`,
	NotARepoError,
}))
jest.unstable_mockModule('../checkpoint/write.js', () => ({
	writeCheckpoint: writeMock,
	markResumed: markMock,
	InvalidCheckpointError,
}))

const { main } = await import('./checkpoint.js')

let stdout: string[]
let stderr: string[]

beforeEach(() => {
	listMock.mockReset()
	writeMock.mockReset()
	markMock.mockReset()
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
	jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
		throw new Error(`exit:${code}`)
	}) as never)
})

afterEach(() => {
	jest.restoreAllMocks()
})

const empty: CheckpointList = { repo: null, folders: [], checkpoints: [] }

test.each([
	[[]],
	[['open']],
	[['list', '--bogus']],
	[['list', 'a', 'b']],
	[['write']],
	[['write', 'a', 'b', 'c']],
	[['write', 'a', '--bogus']],
	[['write', 'a', 'repo', '--home']],
	[['mark-resumed']],
	[['mark-resumed', 'a.md', '--harness', 'h']],
	[['mark-resumed', 'a.md', '--harness', 'h', '--session']],
	[['mark-resumed', 'a.md', '--harness', 'h', '--session', 's', '--pid', 'x']],
	[['mark-resumed', 'a.md', 'b.md', '--harness', 'h', '--session', 's']],
	[['mark-resumed', 'a.md', '--bogus']],
])('rejects %j with exit 2', async (argv) => {
	await expect(main(argv)).rejects.toThrow('exit:2')
	expect(stderr.join('')).toMatch(/usage: repobuddy\.mjs checkpoint list/)
})

test('passes the repo path and prints the listing', async () => {
	listMock.mockReturnValue(empty)
	await main(['list', '../other'])
	expect(listMock).toHaveBeenCalledWith({ repoPath: '../other' })
	await main(['list'])
	expect(listMock).toHaveBeenLastCalledWith({})
	expect(stdout.join('')).toBe('rows:0\nrows:0\n')
})

test('prints JSON with --json', async () => {
	listMock.mockReturnValue(empty)
	await main(['list', '--json'])
	expect(JSON.parse(stdout.join(''))).toEqual(empty)
})

test('exits 1 when the repo path is not in a repo', async () => {
	listMock.mockImplementation(() => {
		throw new NotARepoError('/x is not in a git repo')
	})
	await expect(main(['list', '/x'])).rejects.toThrow('exit:1')
	expect(stderr.join('')).toBe('repobuddy.mjs checkpoint list: /x is not in a git repo\n')
})

test('rethrows any other error', async () => {
	listMock.mockImplementation(() => {
		throw new Error('boom')
	})
	await expect(main(['list'])).rejects.toThrow('boom')
})

test('write passes the slug, repo path and stdin, and prints the path', async () => {
	writeMock.mockReturnValue('/repo/.git/repobuddy/checkpoints/fix-it.md')
	await main(['write', 'fix-it', '../other'], () => 'TEXT')
	expect(writeMock).toHaveBeenCalledWith({ slug: 'fix-it', content: 'TEXT', repoPath: '../other', toHome: false })
	await main(['write', 'fix-it', '--home'], () => 'TEXT')
	expect(writeMock).toHaveBeenLastCalledWith({ slug: 'fix-it', content: 'TEXT', repoPath: undefined, toHome: true })
	expect(stdout.join('')).toBe('/repo/.git/repobuddy/checkpoints/fix-it.md\n'.repeat(2))
})

test('write exits 2 on a checkpoint the format does not allow', async () => {
	writeMock.mockImplementation(() => {
		throw new InvalidCheckpointError('the checkpoint has no `## NEXT` section')
	})
	await expect(main(['write', 'fix-it'], () => '')).rejects.toThrow('exit:2')
	expect(stderr.join('')).toBe('repobuddy.mjs checkpoint write: the checkpoint has no `## NEXT` section\n')
})

test('mark-resumed passes the flags and prints the at', async () => {
	markMock.mockReturnValue({ path: 'a.md', at: '2026-11-22T10:15:00Z' })
	await main(['mark-resumed', 'a.md', '--harness', 'claude-code', '--session', 's1', '--pid', '42'])
	expect(markMock).toHaveBeenCalledWith({ path: 'a.md', harness: 'claude-code', session: 's1', pid: 42 })
	await main(['mark-resumed', '--session', 's1', 'a.md', '--harness', 'claude-code'])
	expect(markMock).toHaveBeenLastCalledWith({ path: 'a.md', harness: 'claude-code', session: 's1', pid: undefined })
	expect(stdout.join('')).toBe('2026-11-22T10:15:00Z\n'.repeat(2))
})

test('reads process.argv by default', async () => {
	const argv = process.argv
	process.argv = ['node', 'repobuddy.mjs']
	try {
		await expect(main()).rejects.toThrow('exit:2')
		expect(stderr.join('')).toMatch(/^missing command\n/)
	} finally {
		process.argv = argv
	}
})
