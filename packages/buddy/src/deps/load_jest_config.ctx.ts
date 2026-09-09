import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * The host interactions the loader needs, gathered so tests can stand in for
 * them without a real project on disk.
 */
export const ctx = {
	existsSync,
	readFile,
	/**
	 * Resolve `specifier` the way a module inside `cwd` would.
	 *
	 * `cwd` is made absolute first: `createRequire` needs an absolute path, and
	 * silently resolves against the wrong place when given a relative one.
	 */
	resolveFrom(cwd: string, specifier: string): string {
		return createRequire(join(resolve(cwd), 'noop.js')).resolve(specifier)
	},
	/** Import a module by absolute path. */
	importModule(path: string): Promise<Record<string, unknown>> {
		return import(pathToFileURL(path).href)
	},
}
