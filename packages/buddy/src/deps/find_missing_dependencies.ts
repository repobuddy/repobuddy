import type { DependencyReport, MissingDependency, PackageManifest, RequiredPackage } from './types.js'

/** Every dependency field npm installs from, in the order a reader would look. */
const dependencyFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'] as const

/** The packages a manifest declares, across every dependency field. */
export function declaredDependencies(manifest: PackageManifest): Set<string> {
	const declared = new Set<string>()
	for (const field of dependencyFields) {
		for (const name of Object.keys(manifest[field] ?? {})) declared.add(name)
	}
	return declared
}

/**
 * Report which of the required packages the manifest does not declare.
 *
 * A package is missing when it appears in no dependency field of the project's
 * own `package.json`. Being present in `node_modules` is deliberately not
 * enough: a package that only resolves because something else pulled it in is
 * still an undeclared dependency, and the next install can take it away.
 *
 * The project's own name is never missing — a monorepo package that references
 * itself through its config depends on nothing.
 */
export function findMissingDependencies(
	required: RequiredPackage[],
	manifest: PackageManifest,
	warnings: string[] = [],
): DependencyReport {
	const declared = declaredDependencies(manifest)
	const missing = new Map<string, MissingDependency>()

	const seen = new Set<string>()
	const deduped = required.filter((pkg) => {
		const key = `${pkg.name} ${pkg.source}`
		if (seen.has(key)) return false
		seen.add(key)
		return true
	})

	for (const pkg of deduped) {
		if (declared.has(pkg.name) || pkg.name === manifest.name) continue
		const entry = missing.get(pkg.name)
		if (entry) entry.sources.push(pkg.source)
		else missing.set(pkg.name, { name: pkg.name, sources: [pkg.source] })
	}

	return { required: deduped, missing: [...missing.values()], warnings }
}
