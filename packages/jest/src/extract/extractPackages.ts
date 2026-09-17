import type { Config } from 'jest'
import { toPackageName } from './packageSpecifier.js'

/**
 * A package referenced by a jest config.
 */
export type ExtractedPackage = {
	/**
	 * The package name, e.g. `jest-watch-typeahead`.
	 */
	name: string
	/**
	 * The specifiers referencing the package, as written in the config,
	 * e.g. `['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname']`.
	 */
	specifiers: string[]
	/**
	 * The config fields referencing the package, e.g. `['watchPlugins']`.
	 */
	fields: string[]
}

/**
 * Reporters jest resolves internally. They are not packages.
 */
const builtinReporters = ['default', 'github-actions', 'summary']

/**
 * `testEnvironment` shorthands and the packages jest resolves them to.
 */
const testEnvironmentPackages: Record<string, string> = {
	jsdom: 'jest-environment-jsdom',
	node: 'jest-environment-node',
}

const stringFields = [
	'dependencyExtractor',
	'globalSetup',
	'globalTeardown',
	'preset',
	'prettierPath',
	'resolver',
	'runner',
	'snapshotResolver',
	'testRunner',
	'testSequencer',
] as const

const stringArrayFields = ['setupFiles', 'setupFilesAfterEnv', 'snapshotSerializers'] as const

/**
 * Extracts the packages a jest config pulls in,
 * so that a missing or outdated one can be named instead of failing obscurely.
 *
 * Covers the fields that reference a package by name:
 * `moduleNameMapper`, `preset`, `reporters`, `resolver`, `setupFiles`,
 * `setupFilesAfterEnv`, `snapshotSerializers`, `testEnvironment`, `transform`,
 * `watchPlugins`, and the other runner/resolver hooks. `projects` is traversed.
 *
 * File paths, `<rootDir>` references, regex replacements, and jest built-ins
 * such as the `default` reporter are not packages and are skipped.
 * `testEnvironment: 'node' | 'jsdom'` resolve to their `jest-environment-*` packages.
 *
 * The result is deduplicated and sorted by package name; `specifiers` and
 * `fields` are sorted too, so the output is stable across runs.
 *
 * @example
 * extractPackages({ watchPlugins: ['jest-watch-suspend'] })
 * // [{ name: 'jest-watch-suspend', specifiers: ['jest-watch-suspend'], fields: ['watchPlugins'] }]
 */
export function extractPackages(config: Config): ExtractedPackage[] {
	const found = new Map<string, { specifiers: Set<string>; fields: Set<string> }>()

	const add = (field: string, specifier: unknown) => {
		if (typeof specifier !== 'string') return
		const name = toPackageName(specifier)
		if (!name) return
		let entry = found.get(name)
		if (!entry) found.set(name, (entry = { specifiers: new Set(), fields: new Set() }))
		entry.specifiers.add(specifier)
		entry.fields.add(field)
	}

	const addEntry = (field: string, entry: unknown) => add(field, Array.isArray(entry) ? entry[0] : entry)

	const collect = (config: Config) => {
		for (const field of stringFields) add(field, config[field])
		for (const field of stringArrayFields) {
			for (const entry of config[field] ?? []) add(field, entry)
		}

		add('testEnvironment', testEnvironmentPackages[config.testEnvironment as string] ?? config.testEnvironment)

		for (const entry of config.watchPlugins ?? []) addEntry('watchPlugins', entry)
		for (const entry of config.reporters ?? []) {
			if (typeof entry === 'string' && builtinReporters.includes(entry)) continue
			addEntry('reporters', entry)
		}
		for (const entry of Object.values(config.transform ?? {})) addEntry('transform', entry)
		for (const entry of Object.values(config.moduleNameMapper ?? {})) {
			for (const specifier of Array.isArray(entry) ? entry : [entry]) add('moduleNameMapper', specifier)
		}

		for (const project of config.projects ?? []) {
			if (typeof project !== 'string') collect(project)
		}
	}

	collect(config)

	return Array.from(found, ([name, { specifiers, fields }]) => ({
		name,
		specifiers: Array.from(specifiers).sort(),
		fields: Array.from(fields).sort(),
	})).sort((a, b) => (a.name < b.name ? -1 : 1))
}
