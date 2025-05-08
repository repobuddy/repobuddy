import type { ViteUserConfig } from 'vitest/config'
import { configDefaults } from './config-defaults.ts'
import type { PresetOptions } from './types.ts'

interface NodePresetOptions extends PresetOptions {
	environment?: 'node' | 'jsdom' | 'happy-dom' | 'edge-runtime' | (string & {}) | undefined
}

/**
 * Creates a Vite plugin for configuring Vitest in a Node.js environment.
 * @param options - Configuration options
 * @param options.environment - The test environment to use (default: 'node')
 * @returns A Vite plugin object
 */
export function nodeTestPreset(options?: NodePresetOptions | undefined) {
	return {
		name: '@repobuddy/vitest/node-preset',
		config(_userConfig?: ViteUserConfig | undefined): any {
			// set timezone to GMT so that the test will generate the same result everywhere
			process.env.TZ = process.env.TZ ?? 'GMT'
			const include = [...configDefaults.include.testNode]
			if (options?.includeGeneralTests) {
				include.push(...configDefaults.include.testGeneral)
			}
			if (options?.environment && ['jsdom', 'happy-dom'].includes(options?.environment)) {
				include.push(...configDefaults.include.testBrowser)
			}
			return {
				test: {
					...configDefaults.test,
					include,
					environment: options?.environment ?? 'node',
					coverage: {
						include: configDefaults.include.source,
						exclude: configDefaults.exclude.test,
					},
				},
			}
		},
	}
}
