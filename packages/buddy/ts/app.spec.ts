import { expect, it } from '@jest/globals'
import { app } from './app.js'
import { readFileSync } from 'node:fs'

it('version matching package.json', () => {
	const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))
	expect(app.version).toBe(pkg.version)
})
