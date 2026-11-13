import { dirname, join } from 'node:path'
import type { ResolverOptions } from 'jest-resolve'
import { resolve } from 'resolve.imports'
import { readPackageUpSync } from './utils/read_package_up.js'

// istanbul ignore next
export function sync(path: string, options: ResolverOptions) {
	try {
		return options.defaultResolver(path, options)
	} catch {
		const result = readPackageUpSync(options.basedir)!
		// `options.conditions` is `[ 'require', 'default', 'node', 'node-addons' ]`
		// which is not correct as it will take `default` over `node`.
		const conditions = options.conditions ? options.conditions.filter((c) => c !== 'default') : []
		const mapped = resolve({ content: result.packageJson, base: options.basedir, path: result.path }, path, {
			conditions,
		})
		if (mapped) {
			if (Array.isArray(mapped)) {
				return mapped.map((p) => options.defaultResolver(join(dirname(result!.path), p), options))
			}
			return options.defaultResolver(join(dirname(result!.path), mapped), options)
		}
	}
}

export function async(path: string, options: ResolverOptions) {
	return Promise.resolve(sync(path, options))
}
