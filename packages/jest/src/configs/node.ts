import type { Config } from 'jest'
import { knownTestEnvironments } from '../fields/index.js'

/**
 * Test identifiers included in a normal test run.
 */
export const defaultTestIdentifiers = [
	'spec',
	'test',
	'unit',
	'accept',
	'integrate',
	'learning',
	'system',
	'perf',
	'stress',
]

/**
 * Test identifiers for load tests, e.g. `feature.load.ts`.
 *
 * Load tests are recognized as test files but are not part of a normal test run,
 * as they are slow and meant to be run on their own.
 * Use `configNode(loadTestIdentifiers)` (or the `nodeLoad` config) to run them.
 */
export const loadTestIdentifiers = ['load']

/**
 * Every test identifier this package recognizes, including the opt-in ones.
 */
export const knownTestIdentifiers = [...defaultTestIdentifiers, ...loadTestIdentifiers]

export const node = configNode()

/**
 * Config running the load tests (`*.load.*`) only.
 */
export const nodeLoad = configNode(loadTestIdentifiers)

export function configNode(identifiers = defaultTestIdentifiers, minNodeVersion = 14) {
	const id = identifiers.join('|')
	const nodeMajorVersion = Number.parseInt(process.version.slice(1, process.version.indexOf('.')), 10)
	const nodeVersions = Array.from(new Array(nodeMajorVersion - minNodeVersion + 1), (_, i) => i + minNodeVersion)

	const testRegex = [`\\.(${id})(\\.node)?\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$`].concat(
		nodeVersions.map((v) => `\\.(${id})\\.node${v}\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$`),
	)

	return {
		// every known test file is ignored for coverage,
		// including the ones this config does not run.
		coveragePathIgnorePatterns: [`\\.(${knownTestIdentifiers.join('|')})(\\..*)?\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$`],
		testEnvironment: knownTestEnvironments.node,
		testRegex,
	} satisfies Config
}
