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
	const { exitCode, result, messages } = await testCommand(build, 'build cjs')

	expect(exitCode).toBeUndefined()
	expect(result).toEqual({ type: 'cjs', tsconfig: 'tsconfig.cjs.json', packageJson: 'cjs/package.json' })
	expect(messages).toContain('packageJson: cjs/package.json')
	expect(execa).toHaveBeenCalledWith('tsc', ['-p', 'tsconfig.cjs.json'])
	expect(JSON.parse(await readFile(join(cwd, 'cjs/package.json'), 'utf8'))).toEqual({ type: 'commonjs' })
})

it('does not copy package.json for esm', async () => {
	const { exitCode, result } = await testCommand(build, 'build esm')

	expect(exitCode).toBeUndefined()
	expect(result).toMatchObject({ type: 'esm', tsconfig: 'tsconfig.esm.json' })
	expect(execa).toHaveBeenCalledWith('tsc', ['-p', 'tsconfig.esm.json'])
})

it('rejects an unknown build type as a usage error', async () => {
	const { exitCode } = await testCommand(build, 'build bogus')

	expect(exitCode).toBe(2)
	expect(execa).not.toHaveBeenCalled()
})

it('reports a failing tsc as a coded error with exit code 1', async () => {
	vi.mocked(execa).mockRejectedValueOnce(Object.assign(new Error('boom'), { shortMessage: 'Command failed: tsc' }))

	const { exitCode, messages } = await testCommand(build, 'build esm')

	expect(exitCode).toBe(1)
	expect(messages).toContain('code: tsc-failed')
	expect(messages).toContain('help')
})

it('reports a missing output directory as a coded error', async () => {
	await rm(join(cwd, 'cjs'), { recursive: true })

	const { exitCode, messages } = await testCommand(build, 'build cjs')

	expect(exitCode).toBe(1)
	expect(messages).toContain('code: copy-failed')
})

it('shows examples in --help', async () => {
	const { messages } = await testCommand(build, 'build --help')

	expect(messages).toContain('buddy ts build esm')
})
