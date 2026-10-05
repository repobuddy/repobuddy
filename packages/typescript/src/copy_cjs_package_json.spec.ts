import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { testCommand } from 'clibuilder/testing'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { copyCJSPackageJson } from './copy_cjs_package_json.js'

let cwd: string
let originalCwd: string

beforeEach(async () => {
	originalCwd = process.cwd()
	cwd = await mkdtemp(join(tmpdir(), 'cpj-'))
	await mkdir(join(cwd, 'cjs'))
})

afterEach(async () => {
	process.chdir(originalCwd)
	await rm(cwd, { recursive: true, force: true })
})

it('copies package.json into the dir under the given cwd', async () => {
	const { exitCode } = await testCommand(copyCJSPackageJson, `copy-cjs-package-json cjs ${cwd}`)

	expect(exitCode).toBeUndefined()
	expect(JSON.parse(await readFile(join(cwd, 'cjs/package.json'), 'utf8'))).toEqual({ type: 'commonjs' })
})

it('defaults cwd to process.cwd()', async () => {
	process.chdir(cwd)

	const { exitCode } = await testCommand(copyCJSPackageJson, 'cpj cjs')

	expect(exitCode).toBeUndefined()
	expect(JSON.parse(await readFile(join(cwd, 'cjs/package.json'), 'utf8'))).toEqual({ type: 'commonjs' })
})
