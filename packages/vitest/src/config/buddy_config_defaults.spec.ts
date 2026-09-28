import { describe, expect, it } from 'vitest'
import { buddyConfigDefaults } from './buddy_config_defaults.ts'

describe('include.testLoad', () => {
	it('matches `*.load.{js,ts}` under the source and tests folders', () => {
		expect(buddyConfigDefaults.include.testLoad).toEqual(['{src,source,code,tests}/**/*.load.{js,cjs,mjs,ts,cts,mts}'])
	})

	it('is not part of the general, node, or browser includes, so a normal run skips load tests', () => {
		const otherIncludes = [
			...buddyConfigDefaults.include.testGeneral,
			...buddyConfigDefaults.include.testNode,
			...buddyConfigDefaults.include.testBrowser,
		]
		otherIncludes.forEach((pattern) => void expect(pattern).not.toContain('load'))
	})
})

describe('exclude.test', () => {
	it('excludes load test files, so they are not counted as source in coverage', () => {
		const identifierPatterns = buddyConfigDefaults.exclude.test.filter((pattern) => pattern.includes('{spec,'))
		expect(identifierPatterns).not.toHaveLength(0)
		identifierPatterns.forEach((pattern) => void expect(pattern).toContain(',load}'))
	})
})
