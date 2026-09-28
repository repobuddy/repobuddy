import { extract } from '@repobuddy/jest'
import type { Config } from 'jest'
import { findMissingDependencies } from './find_missing_dependencies.js'
import { loadJestConfig, loadPreset, readManifest } from './load_jest_config.js'
import { findPackageManager } from './package_manager.js'
import { toRequiredPackages } from './to_required_packages.js'
import type { DependencyReport, RequiredPackage } from './types.js'

/** How many presets deep to follow before giving up, in case a chain loops. */
const maxPresetDepth = 10

export interface CheckDependenciesResult extends DependencyReport {
	/** How the config was named, e.g. `jest.config.mjs`; absent when there is none. */
	from?: string | undefined
	/** The name of the project that was checked, when its manifest has one. */
	project?: string | undefined
	/** The project's `packageManager`, used to word the install suggestion. */
	packageManager?: string | undefined
}

/**
 * Check the project at `cwd` for packages its jest configuration uses but its
 * `package.json` does not declare.
 *
 * The preset chain is followed, because that is where most of the requirements
 * live: a preset such as `@repobuddy/jest/presets/ts-watch` names watch plugins
 * and transformers that the consuming project — not the preset — has to
 * install. A preset that will not load is reported as a warning rather than an
 * error: the usual reason is that the preset package is itself missing, which
 * the config already named.
 */
export async function checkDependencies(cwd: string): Promise<CheckDependenciesResult> {
	const manifest = await readManifest(cwd)
	const common = { project: manifest.name, packageManager: await findPackageManager(cwd) }

	const loaded = await loadJestConfig(cwd)
	if (!loaded) return { ...common, from: undefined, required: [], missing: [], warnings: [] }

	const warnings: string[] = []
	const required: RequiredPackage[] = toRequiredPackages(extract.extractPackages(loaded.config as Config), loaded.from)

	const seen = new Set<string>()
	let preset = loaded.config['preset']
	for (let depth = 0; typeof preset === 'string' && depth < maxPresetDepth; depth++) {
		if (seen.has(preset)) break
		seen.add(preset)
		const config = await loadPreset(preset, cwd)
		if (!config) {
			warnings.push(`could not load preset "${preset}"`)
			break
		}
		required.push(...toRequiredPackages(extract.extractPackages(config as Config), `preset(${preset})`))
		preset = config['preset']
	}

	return { ...common, from: loaded.from, ...findMissingDependencies(required, manifest, warnings) }
}
