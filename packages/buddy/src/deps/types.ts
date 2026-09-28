/**
 * A package that a project's configuration says it needs.
 *
 * This is the seam between *extracting* packages from a config and *reporting*
 * what is missing. Anything able to produce a list of these can be checked by
 * {@link findMissingDependencies}, so a richer extractor can replace the one
 * shipped here without touching the reporting side.
 */
export interface RequiredPackage {
	/** The package name as it would appear in `package.json`. */
	name: string
	/** Where the requirement came from, e.g. `jest.watchPlugins`. */
	source: string
}

/** A required package that the project's `package.json` does not declare. */
export interface MissingDependency {
	name: string
	/** Every configuration location that asked for this package. */
	sources: string[]
}

/** The result of checking a project's declared dependencies against its config. */
export interface DependencyReport {
	/** Every package the configuration asks for, deduplicated by name and source. */
	required: RequiredPackage[]
	/** The subset of `required` the project does not declare. */
	missing: MissingDependency[]
	/** Anything that could not be inspected, e.g. a preset that failed to load. */
	warnings: string[]
}

/** The parts of a `package.json` this check reads. */
export interface PackageManifest {
	name?: string | undefined
	dependencies?: Record<string, string>
	devDependencies?: Record<string, string>
	peerDependencies?: Record<string, string>
	optionalDependencies?: Record<string, string>
}
