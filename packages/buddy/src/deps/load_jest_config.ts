import { join } from 'node:path'
import { ctx } from './load_jest_config.ctx.js'
import type { PackageManifest } from './types.js'

/** Config filenames jest looks for, in the order jest looks for them. */
const configFilenames = [
	'jest.config.js',
	'jest.config.mjs',
	'jest.config.cjs',
	'jest.config.ts',
	'jest.config.mts',
	'jest.config.cts',
	'jest.config.json',
]

export interface LoadedJestConfig {
	config: Record<string, unknown>
	/** How to name the config in a report, e.g. `jest.config.mjs`. */
	from: string
}

function asConfig(value: unknown): Record<string, unknown> | undefined {
	return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined
}

async function importConfig(path: string): Promise<Record<string, unknown> | undefined> {
	const module = await ctx.importModule(path)
	const exported = 'default' in module ? module['default'] : module
	// jest allows the config to be a function, sync or async.
	const value = typeof exported === 'function' ? await (exported as () => unknown)() : exported
	return asConfig(value)
}

/** Read and parse the `package.json` of the project at `cwd`. */
export async function readManifest(cwd: string): Promise<PackageManifest> {
	const content = await ctx.readFile(join(cwd, 'package.json'), 'utf-8')
	return JSON.parse(content as string) as PackageManifest
}

/**
 * Find and load the jest configuration of the project at `cwd`.
 *
 * A config file wins over the `jest` field of `package.json`, matching jest
 * itself. Returns `undefined` when the project configures no jest at all.
 *
 * @throws when a config file exists but cannot be read — an unreadable config
 * is a problem to report, not an absence.
 */
export async function loadJestConfig(cwd: string): Promise<LoadedJestConfig | undefined> {
	for (const filename of configFilenames) {
		const path = join(cwd, filename)
		if (!ctx.existsSync(path)) continue
		const config = filename.endsWith('.json')
			? asConfig(JSON.parse((await ctx.readFile(path, 'utf-8')) as string))
			: await importConfig(path)
		if (config) return { config, from: filename }
	}

	const manifest = asConfig(await readManifest(cwd))
	const inManifest = manifest && asConfig(manifest['jest'])
	return inManifest ? { config: inManifest, from: 'package.json#jest' } : undefined
}

/**
 * Load the config a `preset` value points at.
 *
 * Follows the same shapes jest accepts: the module itself, or a `jest-preset`
 * file inside the package. Returns `undefined` when none of them resolve —
 * which usually means the preset package is the missing dependency, and is
 * reported as such rather than thrown.
 */
export async function loadPreset(preset: string, cwd: string): Promise<Record<string, unknown> | undefined> {
	for (const specifier of [preset, `${preset}/jest-preset.js`, `${preset}/jest-preset.json`]) {
		let path: string
		try {
			path = ctx.resolveFrom(cwd, specifier)
		} catch {
			continue
		}
		try {
			const config = path.endsWith('.json')
				? asConfig(JSON.parse((await ctx.readFile(path, 'utf-8')) as string))
				: await importConfig(path)
			if (config) return config
		} catch {
			// A resolvable but unloadable preset is indistinguishable, for this
			// check, from one that is not there; keep trying the other shapes.
		}
	}
	return undefined
}
