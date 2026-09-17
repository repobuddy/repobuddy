/**
 * Matches a valid npm package name, optionally scoped.
 *
 * Deliberately stricter than the resolver: it is used to tell a package
 * specifier apart from a file path, a regex replacement (`$1`),
 * or a jest built-in alias.
 */
const packageNamePattern = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/

/**
 * Extracts the package name from a module specifier.
 *
 * Returns `undefined` when the specifier does not name a package,
 * e.g. a relative path, a `<rootDir>` path, or a regex replacement.
 *
 * @example
 * toPackageName('jest-watch-typeahead/filename') // 'jest-watch-typeahead'
 * toPackageName('@swc/jest') // '@swc/jest'
 * toPackageName('<rootDir>/setup.ts') // undefined
 */
export function toPackageName(specifier: string): string | undefined {
	if (!specifier || specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('<rootDir>')) return
	if (specifier.startsWith('node:')) return
	const parts = specifier.split('/')
	const name = specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
	if (!name || !packageNamePattern.test(name)) return
	return name
}
