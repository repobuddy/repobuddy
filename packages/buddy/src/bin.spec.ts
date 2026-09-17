import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'

const ROOT = join(import.meta.dirname, '..')
const BIN = join(ROOT, 'bin', 'buddy.js')
const ESM_BIN = join(ROOT, 'esm', 'bin.js')

describe('bin/buddy.js', () => {
	let cwd: string

	beforeEach(() => {
		// A directory outside any repo, with no `.repobuddy*` file and no `repobuddy` key in its
		// package.json — the state clibuilder's config lookup calls "no config found".
		cwd = mkdtempSync(join(tmpdir(), 'repobuddy-bin-'))
	})

	afterEach(() => {
		rmSync(cwd, { recursive: true, force: true })
	})

	it('--version prints only the version, with no config-lookup noise', () => {
		if (!existsSync(ESM_BIN)) {
			console.warn(`skipping: ${ESM_BIN} does not exist — run \`pnpm build\` first`)
			return
		}
		const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'))
		const r = spawnSync('node', [BIN, '--version'], { cwd, encoding: 'utf8' })
		expect(r.stderr).toBe('')
		expect(r.stdout.trim()).toBe(pkg.version)
	})

	it('--help prints no config-lookup noise', () => {
		if (!existsSync(ESM_BIN)) {
			console.warn(`skipping: ${ESM_BIN} does not exist — run \`pnpm build\` first`)
			return
		}
		const r = spawnSync('node', [BIN, '--help'], { cwd, encoding: 'utf8' })
		expect(r.stderr).toBe('')
		expect(r.stdout).not.toMatch(/no config found under/)
	})
})
