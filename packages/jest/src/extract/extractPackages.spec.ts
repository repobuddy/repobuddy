import { describe, expect, it } from '@jest/globals'
import { knownModuleNameMappers } from '../fields/moduleNameMapper.js'
import { knownTransforms } from '../fields/transform.js'
import { watchPlugins } from '../fields/watchPlugins.js'
import { extractPackages } from './extractPackages.js'

describe(`${extractPackages.name}()`, () => {
	it('returns nothing for an empty config', () => {
		expect(extractPackages({})).toEqual([])
	})

	it('extracts watch plugins, with and without options', () => {
		expect(extractPackages({ watchPlugins })).toEqual([
			{
				name: 'jest-watch-suspend',
				specifiers: ['jest-watch-suspend'],
				fields: ['watchPlugins'],
			},
			{
				name: 'jest-watch-toggle-config',
				specifiers: ['jest-watch-toggle-config'],
				fields: ['watchPlugins'],
			},
			{
				name: 'jest-watch-typeahead',
				specifiers: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
				fields: ['watchPlugins'],
			},
		])
	})

	it('extracts transformers, with and without options', () => {
		expect(extractPackages({ transform: knownTransforms.tsJestCjs() })).toEqual([
			{ name: 'jest-esm-transformer-2', specifiers: ['jest-esm-transformer-2'], fields: ['transform'] },
			{ name: 'ts-jest', specifiers: ['ts-jest'], fields: ['transform'] },
		])
	})

	it('extracts module name mapper targets and skips regex replacements', () => {
		const moduleNameMapper = { ...knownModuleNameMappers.tsEsm, ...knownModuleNameMappers.cssAll }
		expect(extractPackages({ moduleNameMapper })).toEqual([
			{ name: 'identity-obj-proxy', specifiers: ['identity-obj-proxy'], fields: ['moduleNameMapper'] },
		])
	})

	it('extracts every target of a multi-target module name mapper', () => {
		expect(extractPackages({ moduleNameMapper: { '^a$': ['pkg-a', '<rootDir>/a.ts'] } })).toEqual([
			{ name: 'pkg-a', specifiers: ['pkg-a'], fields: ['moduleNameMapper'] },
		])
	})

	it.each([
		['jsdom', 'jest-environment-jsdom'],
		['node', 'jest-environment-node'],
	])('resolves the %s testEnvironment shorthand to %s', (testEnvironment, name) => {
		expect(extractPackages({ testEnvironment })).toEqual([{ name, specifiers: [name], fields: ['testEnvironment'] }])
	})

	it('extracts a testEnvironment named by package', () => {
		expect(extractPackages({ testEnvironment: '@happy-dom/jest-environment' })).toEqual([
			{
				name: '@happy-dom/jest-environment',
				specifiers: ['@happy-dom/jest-environment'],
				fields: ['testEnvironment'],
			},
		])
	})

	it('extracts reporters and skips the jest built-in ones', () => {
		expect(extractPackages({ reporters: ['default', 'github-actions', 'summary', ['jest-junit', {}]] })).toEqual([
			{ name: 'jest-junit', specifiers: ['jest-junit'], fields: ['reporters'] },
		])
	})

	it('extracts the resolver, runners and other single-package hooks', () => {
		expect(
			extractPackages({
				dependencyExtractor: 'pkg-dependency-extractor',
				globalSetup: 'pkg-global-setup',
				globalTeardown: 'pkg-global-teardown',
				preset: '@repobuddy/jest/presets/ts',
				prettierPath: 'prettier',
				resolver: '@repobuddy/jest/resolver',
				runner: 'pkg-runner',
				snapshotResolver: 'pkg-snapshot-resolver',
				testRunner: 'jest-circus',
				testSequencer: 'pkg-test-sequencer',
			}).map((p) => p.name),
		).toEqual([
			'@repobuddy/jest',
			'jest-circus',
			'pkg-dependency-extractor',
			'pkg-global-setup',
			'pkg-global-teardown',
			'pkg-runner',
			'pkg-snapshot-resolver',
			'pkg-test-sequencer',
			'prettier',
		])
	})

	it('extracts setup files and snapshot serializers, skipping local paths', () => {
		expect(
			extractPackages({
				setupFiles: ['pkg-setup', '<rootDir>/setup.ts'],
				setupFilesAfterEnv: ['@testing-library/jest-dom', './after-env.ts'],
				snapshotSerializers: ['jest-serializer-html'],
			}).map((p) => p.name),
		).toEqual(['@testing-library/jest-dom', 'jest-serializer-html', 'pkg-setup'])
	})

	it('merges the fields and specifiers of a package referenced more than once', () => {
		expect(
			extractPackages({
				preset: '@repobuddy/jest/presets/ts',
				resolver: '@repobuddy/jest/resolver',
			}),
		).toEqual([
			{
				name: '@repobuddy/jest',
				specifiers: ['@repobuddy/jest/presets/ts', '@repobuddy/jest/resolver'],
				fields: ['preset', 'resolver'],
			},
		])
	})

	it('extracts packages from nested projects', () => {
		expect(
			extractPackages({
				projects: ['<rootDir>/packages/*', { displayName: 'node', testEnvironment: 'node' }],
				watchPlugins: ['jest-watch-suspend'],
			}).map((p) => p.name),
		).toEqual(['jest-environment-node', 'jest-watch-suspend'])
	})
})
