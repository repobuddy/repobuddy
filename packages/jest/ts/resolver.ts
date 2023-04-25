import type { ResolverOptions } from 'jest-resolve'
import { dirname, join } from 'node:path'
import { sync as readPkgSync } from 'read-pkg-up'
import { resolve } from 'resolve.imports'

// istanbul ignore next
export function sync(path: string, options: ResolverOptions) {
	try {
		return options.defaultResolver(path, options)
	} catch {
		const result = readPkgSync({ cwd: options.basedir })!
		// `options.conditions` is `[ 'require', 'default', 'node', 'node-addons' ]`
		// which is not correct as it will take `default` over `node`.
		const conditions = options.conditions ? options.conditions.filter((c) => c !== 'default') : []
		const mapped = resolve(
			{ content: result.packageJson['imports'], base: options.basedir, path: result.path },
			path,
			{ conditions }
		)
		if (mapped) {
			if (Array.isArray(mapped)) {
				return mapped.map((p) => options.defaultResolver(join(dirname(result!.path), p), options))
			} else {
				return options.defaultResolver(join(dirname(result!.path), mapped), options)
			}
		}
	}
}

export function async(path: string, options: ResolverOptions) {
	return Promise.resolve(sync(path, options))
}
