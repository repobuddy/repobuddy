import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from '@jest/globals'
import { readPackageUpSync } from './read_package_up.js'

describe('readPackageUpSync', () => {
	const root = mkdtempSync(join(tmpdir(), 'read-package-up-'))
	const nested = join(root, 'a', 'b')
	mkdirSync(nested, { recursive: true })
	writeFileSync(join(root, 'package.json'), JSON.stringify({ name: 'root', type: 'module' }))
	afterAll(() => rmSync(root, { recursive: true, force: true }))

	it('finds the nearest package.json above cwd', () => {
		expect(readPackageUpSync(nested)).toEqual({
			packageJson: { name: 'root', type: 'module' },
			path: join(root, 'package.json'),
		})
	})

	it('prefers the closest package.json', () => {
		writeFileSync(join(root, 'a', 'package.json'), JSON.stringify({ name: 'a' }))
		expect(readPackageUpSync(nested)?.packageJson).toEqual({ name: 'a' })
	})

	it('defaults to process.cwd()', () => {
		expect(readPackageUpSync()?.packageJson['name']).toBe('@repobuddy/jest')
	})
})
