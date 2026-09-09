import { describe, expect, it } from '@jest/globals'
import { a } from 'assertron'
import { every } from 'satisfier'
import { configNode, nodeLoad } from './index.js'

describe(`${configNode.name}()`, () => {
	it('defaults with spec|test|unit|accept|integrate|learning|system|perf|stress identifiers', () => {
		a.satisfies(configNode().testRegex, every(/\(spec|test|unit|accept|integrate|learning|system|perf|stress\)/))
	})

	it('does not run load tests by default', () => {
		configNode().testRegex.forEach((regex) => {
			expect('feature.load.ts').not.toMatch(new RegExp(regex))
		})
	})

	it('runs load tests when the load identifier is given', () => {
		const [testRegex] = configNode(['load']).testRegex
		expect('feature.load.ts').toMatch(new RegExp(testRegex!))
		expect('feature.load.js').toMatch(new RegExp(testRegex!))
	})

	it('ignores load test files for coverage even when it does not run them', () => {
		const [ignorePattern] = configNode().coveragePathIgnorePatterns
		expect('feature.load.ts').toMatch(new RegExp(ignorePattern!))
	})
})

describe('nodeLoad', () => {
	it('runs load tests only', () => {
		const [testRegex] = nodeLoad.testRegex
		expect('feature.load.ts').toMatch(new RegExp(testRegex!))
		expect('feature.spec.ts').not.toMatch(new RegExp(testRegex!))
	})
})
