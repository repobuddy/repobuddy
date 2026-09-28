import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from '@jest/globals'
import { detectManager, isPackageManager } from './managers.js'

function tmp(): string {
	return mkdtempSync(join(tmpdir(), 'managers-'))
}

test('isPackageManager', () => {
	assert.equal(isPackageManager('pnpm'), true)
	assert.equal(isPackageManager('deno'), false)
})

test('detectManager: packageManager field in package.json wins', () => {
	const dir = tmp()
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ packageManager: 'yarn@4.10.0' }))
	assert.equal(detectManager(dir), 'yarn')
})

test('detectManager: unrecognized packageManager field falls through to lockfile sniffing', () => {
	const dir = tmp()
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ packageManager: 'deno@1.0.0' }))
	writeFileSync(join(dir, 'pnpm-lock.yaml'), '')
	assert.equal(detectManager(dir), 'pnpm')
})

test('detectManager: no packageManager field falls through to lockfile sniffing', () => {
	const dir = tmp()
	writeFileSync(join(dir, 'package.json'), JSON.stringify({}))
	writeFileSync(join(dir, 'pnpm-workspace.yaml'), '')
	assert.equal(detectManager(dir), 'pnpm')
})

test('detectManager: yarn via yarnrc or lockfile', () => {
	const dir = tmp()
	writeFileSync(join(dir, '.yarnrc.yml'), '')
	assert.equal(detectManager(dir), 'yarn')
	const dir2 = tmp()
	writeFileSync(join(dir2, 'yarn.lock'), '')
	assert.equal(detectManager(dir2), 'yarn')
})

test('detectManager: bun via lock, lockb, or bunfig', () => {
	const dir = tmp()
	writeFileSync(join(dir, 'bun.lock'), '')
	assert.equal(detectManager(dir), 'bun')
	const dir2 = tmp()
	writeFileSync(join(dir2, 'bun.lockb'), '')
	assert.equal(detectManager(dir2), 'bun')
	const dir3 = tmp()
	writeFileSync(join(dir3, 'bunfig.toml'), '')
	assert.equal(detectManager(dir3), 'bun')
})

test('detectManager: npm via package-lock.json or .npmrc', () => {
	const dir = tmp()
	writeFileSync(join(dir, 'package-lock.json'), '')
	assert.equal(detectManager(dir), 'npm')
	const dir2 = tmp()
	writeFileSync(join(dir2, '.npmrc'), '')
	assert.equal(detectManager(dir2), 'npm')
})

test('detectManager: nothing recognizable returns undefined', () => {
	const dir = tmp()
	assert.equal(detectManager(dir), undefined)
})
