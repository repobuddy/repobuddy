import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { ConfigError, readConfig, WEIGHTS_FILE } from './config.js'

let dir: string

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'agent-readiness-config-'))
})

afterEach(() => {
	rmSync(dir, { recursive: true, force: true })
})

function writeConfig(text: string) {
	mkdirSync(join(dir, '.agents/readiness'), { recursive: true })
	writeFileSync(join(dir, WEIGHTS_FILE), text)
}

describe('readConfig', () => {
	it('returns no overrides when the file is absent', () => {
		expect(readConfig(dir)).toEqual({})
	})

	it('reads partial weight overrides', () => {
		writeConfig('{ "verification": 40, "noise": 0 }')
		expect(readConfig(dir)).toEqual({ weights: { verification: 40, noise: 0 } })
	})

	it('accepts an empty file object', () => {
		writeConfig('{}')
		expect(readConfig(dir)).toEqual({})
	})

	it.each([
		['not json', /invalid JSON/],
		['[]', /expected an object/],
		['{ "weights": { "noise": 30 } }', /unknown area "weights"/],
		['{ "security": 10 }', /unknown area "security"/],
		['{ "toString": 10 }', /unknown area "toString"/],
		['{ "noise": -1 }', /"noise" must be a non-negative number/],
		['{ "noise": "5" }', /"noise" must be a non-negative number/],
	])('rejects %s', (text, message) => {
		writeConfig(text)
		expect(() => readConfig(dir)).toThrow(ConfigError)
		expect(() => readConfig(dir)).toThrow(message)
	})
})
