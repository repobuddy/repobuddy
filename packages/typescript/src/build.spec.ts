import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { testCommand } from 'clibuilder/testing'
import { execa } from 'execa'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { build } from './build.js'

vi.mock('execa', () => ({ execa: vi.fn() }))

let cwd: string
let originalCwd: string

beforeEach(async () => {
	originalCwd = process.cwd()
	cwd = await mkdtemp(join(tmpdir(), 'build-'))
	await mkdir(join(cwd, 'cjs'))
	process.chdir(cwd)
	vi.mocked(execa).mockClear()
})

afterEach(async () => {
	process.chdir(originalCwd)
	await rm(cwd, { recursive: true, force: true })
})

it('compiles with the tsconfig for the build type and copies package.json for cjs', async () => {
	const { exitCode } = await testCommand(build, 'build cjs')

	expect(exitCode).toBeUndefined()
	expect(execa).toHaveBeenCalledWith('tsc', ['-p', 'tsconfig.cjs.json'])
	expect(JSON.parse(await readFile(join(cwd, 'cjs/package.json'), 'utf8'))).toEqual({ type: 'commonjs' })
})

it('does not copy package.json for esm', async () => {
	const { exitCode } = await testCommand(build, 'build esm')

	expect(exitCode).toBeUndefined()
	expect(execa).toHaveBeenCalledWith('tsc', ['-p', 'tsconfig.esm.json'])
})

it('rejects an unknown build type as a usage error', async () => {
	const { exitCode } = await testCommand(build, 'build bogus')

	expect(exitCode).toBe(2)
	expect(execa).not.toHaveBeenCalled()
})
