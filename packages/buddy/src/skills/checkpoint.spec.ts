import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import type { CheckpointList } from '../checkpoint/list.js'

const listMock = jest.fn<(options: unknown) => CheckpointList>()

class NotARepoError extends Error {}
jest.unstable_mockModule('../checkpoint/list.js', () => ({
	listCheckpoints: listMock,
	formatList: (list: CheckpointList) => `rows:${list.checkpoints.length}\n`,
	NotARepoError,
}))

const { main } = await import('./checkpoint.js')

let stdout: string[]
let stderr: string[]

beforeEach(() => {
	listMock.mockReset()
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

test.each([[[]], [['open']], [['list', '--bogus']], [['list', 'a', 'b']]])('rejects %j with exit 2', async (argv) => {
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
