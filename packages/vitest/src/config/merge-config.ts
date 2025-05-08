import { mergeConfig as mc } from 'vitest/config'

/**
 * Merges two configuration objects, with overrides taking precedence over base values.
 * This is a type-safe wrapper around Vitest's mergeConfig utility.
 *
 * @param base - The base configuration object
 * @param overrides - The overrides configuration object that will be merged on top of base
 * @param isRoot - Whether the configuration is the root configuration
 * @returns A merged configuration object combining base and overrides
 *
 * @example
 *
 * ```ts
 * const baseConfig = { test: { name: 'base' } };
 * const overrideConfig = { test: { browser: true } };
 * const merged = mergeConfig(baseConfig, overrideConfig);
 * // Result: { test: { name: 'base', browser: true } }
 * ```
 */
export function mergeConfig<D extends Record<string, any>, O extends Record<string, any> | undefined>(
	base: D,
	overrides: O,
	isRoot?: boolean | undefined,
): D & O {
	return mc(base as any, overrides as any, isRoot) as D & O
}
