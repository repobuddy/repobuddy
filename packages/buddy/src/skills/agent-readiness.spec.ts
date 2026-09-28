import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
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

test.each([[[]], [['bogus']], [['score', '--dir']], [['score', '--nope']]])(
	'rejects bad usage %j with exit 2',
	async (argv) => {
		await expect(main(argv)).rejects.toThrow('exit:2')
		expect(stderr.join('')).toMatch(/usage: agent-readiness\.mjs score/)
	},
)

test('prints the human report', async () => {
	await main(['score', '--dir', dir])
	expect(stdout.join('')).toMatch(/^Level 1 of 4: An agent can read it/)
})

test('prints JSON with --json', async () => {
	await main(['score', '--dir', dir, '--json'])
	const result = JSON.parse(stdout.join(''))
	expect(result.level).toBe(1)
	expect(result.weights.verification).toBe(25)
})
