import { describe, expect, it } from '@jest/globals'
import { toRequiredPackages } from './to_required_packages.js'

describe(`${toRequiredPackages.name}()`, () => {
	it('returns nothing for an empty extraction', () => {
		expect(toRequiredPackages([], 'jest.config.mjs')).toEqual([])
	})

	it('labels each requirement with its origin and field', () => {
		expect(
			toRequiredPackages([{ name: 'ts-jest', specifiers: ['ts-jest'], fields: ['transform'] }], 'jest.config.mjs'),
		).toEqual([{ name: 'ts-jest', source: 'jest.config.mjs transform' }])
	})

	it('reports a package once per field that referenced it', () => {
		expect(
			toRequiredPackages(
				[
					{
						name: 'jest-watch-typeahead',
						specifiers: ['jest-watch-typeahead/filename'],
						fields: ['setupFiles', 'watchPlugins'],
					},
				],
				'jest.config.mjs',
			),
		).toEqual([
			{ name: 'jest-watch-typeahead', source: 'jest.config.mjs setupFiles' },
			{ name: 'jest-watch-typeahead', source: 'jest.config.mjs watchPlugins' },
		])
	})

	it('drops jest-environment-node, which ships with jest', () => {
		expect(
			toRequiredPackages(
				[
					{ name: 'jest-environment-node', specifiers: ['node'], fields: ['testEnvironment'] },
					{ name: 'ts-jest', specifiers: ['ts-jest'], fields: ['transform'] },
				],
				'jest.config.mjs',
			),
		).toEqual([{ name: 'ts-jest', source: 'jest.config.mjs transform' }])
	})

	it('keeps jest-environment-jsdom, which is a separate install', () => {
		expect(
			toRequiredPackages(
				[{ name: 'jest-environment-jsdom', specifiers: ['jsdom'], fields: ['testEnvironment'] }],
				'jest.config.mjs',
			),
		).toEqual([{ name: 'jest-environment-jsdom', source: 'jest.config.mjs testEnvironment' }])
	})
})
