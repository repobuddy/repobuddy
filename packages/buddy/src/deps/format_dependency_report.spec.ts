import { describe, expect, it } from '@jest/globals'
import { formatDependencyReport, installCommand } from './format_dependency_report.js'

describe(`${installCommand.name}()`, () => {
	it.each([
		['pnpm@12.3.4', 'pnpm add -D a b'],
		['yarn@4.0.0', 'yarn add -D a b'],
		['bun@1.2.0', 'bun add -d a b'],
		['npm@11.0.0', 'npm i -D a b'],
	])('words the suggestion for %s', (packageManager, expected) => {
		expect(installCommand(['a', 'b'], packageManager)).toBe(expected)
	})

	it('falls back to npm when the project declares no package manager', () => {
		expect(installCommand(['a'])).toBe('npm i -D a')
	})
})

describe(`${formatDependencyReport.name}()`, () => {
	it('says so when there is no jest configuration to check', () => {
		expect(formatDependencyReport({ required: [], missing: [], warnings: [] })).toEqual([
			'dependencies: no jest configuration found, nothing to check',
		])
	})

	it('says so when everything is declared', () => {
		expect(
			formatDependencyReport({
				from: 'jest.config.mjs',
				required: [{ name: 'ts-jest', source: 'jest.config.mjs transform' }],
				missing: [],
				warnings: [],
			}),
		).toEqual(['dependencies: 1 used by jest.config.mjs, all declared in package.json'])
	})

	it('names each missing package, where it came from, and how to install it', () => {
		expect(
			formatDependencyReport({
				from: 'jest.config.mjs',
				packageManager: 'pnpm@12.3.4',
				required: [],
				missing: [
					{ name: 'jest-watch-suspend', sources: ['preset(@repobuddy/jest/presets/ts-watch) watchPlugins'] },
					{ name: 'ts-jest', sources: ['jest.config.mjs transform'] },
				],
				warnings: [],
			}),
		).toEqual([
			'missing dependencies: 2 used by jest.config.mjs but not declared in package.json',
			'  jest-watch-suspend  preset(@repobuddy/jest/presets/ts-watch) watchPlugins',
			'  ts-jest             jest.config.mjs transform',
			'install: pnpm add -D jest-watch-suspend ts-jest',
		])
	})

	it('lists every source of a package asked for more than once', () => {
		const lines = formatDependencyReport({
			from: 'package.json#jest',
			required: [],
			missing: [{ name: 'ts-jest', sources: ['package.json#jest transform', 'preset(x) transform'] }],
			warnings: [],
		})
		expect(lines[1]).toBe('  ts-jest  package.json#jest transform, preset(x) transform')
	})

	it('leaves warnings to the caller', () => {
		expect(formatDependencyReport({ required: [], missing: [], warnings: ['could not load preset "x"'] })).toEqual([
			'dependencies: no jest configuration found, nothing to check',
		])
	})
})
