import type { Config } from 'jest'
import { knownTestEnvironments } from '../fields/index.js'

export const node = configNode()

export function configNode(
	identifiers = ['spec', 'test', 'unit', 'accept', 'integrate', 'learning', 'system', 'perf', 'stress'],
	minNodeVersion = 14,
) {
	const id = identifiers.join('|')
	const nodeMajorVersion = Number.parseInt(process.version.slice(1, process.version.indexOf('.')), 10)
	const nodeVersions = Array.from(new Array(nodeMajorVersion - minNodeVersion + 1), (_, i) => i + minNodeVersion)

	const testRegex = [`\\.(${id})(\\.node)?\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$`].concat(
		nodeVersions.map((v) => `\\.(${id})\\.node${v}\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$`),
	)

	return {
		coveragePathIgnorePatterns: [`\\.(${id})(\\..*)?\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$`],
		testEnvironment: knownTestEnvironments.node,
		testRegex,
	} satisfies Config
}
