import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { testCommand } from 'clibuilder/testing'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { activate } from './index.js'

let cwd: string
let originalCwd: string

beforeEach(async () => {
	originalCwd = process.cwd()
	cwd = await mkdtemp(join(tmpdir(), 'ts-'))
	process.chdir(cwd)
})

afterEach(async () => {
	process.chdir(originalCwd)
	await rm(cwd, { recursive: true, force: true })
})

function getTs() {
	let ts: any
	activate({ addCommand: (c: any) => (ts = c) } as any)
	return ts
}

it('adds the ts command with its sub-commands', () => {
	expect(getTs().commands.map((c: any) => c.name)).toEqual(['build', 'copy-cjs-package-json'])
})

it('lists the builds that have a tsconfig when invoked bare', async () => {
	await writeFile(join(cwd, 'tsconfig.esm.json'), '{}')
	await mkdir(join(cwd, 'x'))

	const { result, exitCode, messages } = await testCommand(getTs(), 'ts')

	expect(exitCode).toBeUndefined()
	expect(result).toEqual({ builds: ['esm'] })
	expect(messages).toContain('buddy ts build')
})

it('says zero when no tsconfig matches', async () => {
	const { messages } = await testCommand(getTs(), 'ts')

	expect(messages).toContain('0 builds found')
})
