import { describe, expect, it } from '@jest/globals'
import { declaredDependencies, findMissingDependencies } from './find_missing_dependencies.js'

describe(`${declaredDependencies.name}()`, () => {
	it('reads every dependency field', () => {
		expect(
			declaredDependencies({
				dependencies: { a: '1' },
				devDependencies: { b: '1' },
				peerDependencies: { c: '1' },
				optionalDependencies: { d: '1' },
			}),
		).toEqual(new Set(['a', 'b', 'c', 'd']))
	})

	it('is empty for a manifest with no dependencies', () => {
		expect(declaredDependencies({})).toEqual(new Set())
	})
})

describe(`${findMissingDependencies.name}()`, () => {
	it('reports nothing when every package is declared', () => {
		const report = findMissingDependencies([{ name: 'ts-jest', source: 'jest.transform' }], {
			devDependencies: { 'ts-jest': '^29' },
		})
		expect(report.missing).toEqual([])
	})

	it('reports a package no dependency field declares', () => {
		const report = findMissingDependencies([{ name: 'jest-watch-suspend', source: 'jest.watchPlugins' }], {})
		expect(report.missing).toEqual([{ name: 'jest-watch-suspend', sources: ['jest.watchPlugins'] }])
	})

	it.each(['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const)(
		'accepts a package declared in %s',
		(field) => {
			const report = findMissingDependencies([{ name: 'ts-jest', source: 'jest.transform' }], {
				[field]: { 'ts-jest': '^29' },
			})
			expect(report.missing).toEqual([])
		},
	)

	it('lists every source that asked for a missing package', () => {
		const report = findMissingDependencies(
			[
				{ name: 'jest-watch-typeahead', source: 'jest.watchPlugins' },
				{ name: 'jest-watch-typeahead', source: 'preset(@repobuddy/jest).watchPlugins' },
			],
			{},
		)
		expect(report.missing).toEqual([
			{
				name: 'jest-watch-typeahead',
				sources: ['jest.watchPlugins', 'preset(@repobuddy/jest).watchPlugins'],
			},
		])
	})

	it('does not report the project itself', () => {
		const report = findMissingDependencies([{ name: 'my-lib', source: 'jest.preset' }], { name: 'my-lib' })
		expect(report.missing).toEqual([])
	})

	it('deduplicates identical name and source pairs', () => {
		const report = findMissingDependencies(
			[
				{ name: 'identity-obj-proxy', source: 'jest.moduleNameMapper' },
				{ name: 'identity-obj-proxy', source: 'jest.moduleNameMapper' },
			],
			{},
		)
		expect(report.required).toHaveLength(1)
		expect(report.missing).toEqual([{ name: 'identity-obj-proxy', sources: ['jest.moduleNameMapper'] }])
	})

	it('carries warnings through', () => {
		expect(findMissingDependencies([], {}, ['could not load preset']).warnings).toEqual(['could not load preset'])
	})
})
