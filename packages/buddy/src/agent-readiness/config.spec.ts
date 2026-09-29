import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { CONFIG_FILE, ConfigError, readConfig } from './config.js'

let dir: string

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'agent-readiness-config-'))
})

afterEach(() => {
	rmSync(dir, { recursive: true, force: true })
})

function writeConfig(text: string) {
	mkdirSync(join(dir, '.agents'), { recursive: true })
	writeFileSync(join(dir, CONFIG_FILE), text)
}

describe('readConfig', () => {
	it('returns no overrides when the file is absent', () => {
		expect(readConfig(dir)).toEqual({})
	})

	it('reads partial weight overrides', () => {
		writeConfig('{ "weights": { "verification": 40, "noise": 0 } }')
		expect(readConfig(dir)).toEqual({ weights: { verification: 40, noise: 0 } })
	})

	it('accepts a file without weights', () => {
		writeConfig('{}')
		expect(readConfig(dir)).toEqual({})
	})

	it.each([
		['not json', /invalid JSON/],
		['[]', /expected an object/],
		['{ "minLevel": 3 }', /unknown key "minLevel"/],
		['{ "weights": [1] }', /"weights" must be an object/],
		['{ "weights": { "security": 10 } }', /unknown area "security"/],
		['{ "weights": { "toString": 10 } }', /unknown area "toString"/],
		['{ "weights": { "noise": -1 } }', /"noise" must be a non-negative number/],
		['{ "weights": { "noise": "5" } }', /"noise" must be a non-negative number/],
	])('rejects %s', (text, message) => {
		writeConfig(text)
		expect(() => readConfig(dir)).toThrow(ConfigError)
		expect(() => readConfig(dir)).toThrow(message)
	})
})
