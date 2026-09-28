import type { RequiredPackage } from './types.js'

/**
 * The shape this check consumes, satisfied by `extract.extractPackages()` in
 * `@repobuddy/jest`.
 *
 * Declared here rather than imported so the reporting side depends on the
 * *shape* of an extraction and not on one particular extractor: anything that
 * can name the packages a config references, and the fields that named them,
 * can be reported on.
 */
export interface ExtractedPackage {
	name: string
	specifiers: string[]
	fields: string[]
}

/**
 * Packages that arrive with jest itself, so a project never has to declare
 * them. `jest-environment-node` is the one an extraction always turns up,
 * because it is the default `testEnvironment`; it is a transitive dependency of
 * jest and reporting it would be noise on every project.
 */
const bundledWithJest = ['jest-environment-node']

/**
 * Adapt an extraction into the requirements this check reports on, labelling
 * each one with where it came from.
 *
 * @param origin what to call the config the packages were extracted from, e.g.
 * `jest.config.mjs` or `preset(@repobuddy/jest/presets/ts-watch)`. A missing
 * package is only actionable if the reader can find the line that asked for it.
 */
export function toRequiredPackages(extracted: ExtractedPackage[], origin: string): RequiredPackage[] {
	return extracted
		.filter((pkg) => !bundledWithJest.includes(pkg.name))
		.flatMap((pkg) => pkg.fields.map((field) => ({ name: pkg.name, source: `${origin} ${field}` })))
}
