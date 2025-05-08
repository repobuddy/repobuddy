import type { ViteUserConfig } from 'vitest/config'
import { configDefaults } from './config-defaults.ts'
import { mergeConfig } from './merge-config.ts'
import type { PresetOptions } from './types.ts'

/**
 * Configures Vitest for browser-based testing using Playwright.
 * @returns A Vite plugin with the browser test configuration.
 */
export function browserTestPreset(options?: PresetOptions | undefined) {
	return {
		name: '@repobuddy/vitest/browser-preset',
		config(userConfig?: ViteUserConfig | undefined) {
			// set timezone to GMT so that the test will generate the same result everywhere
			process.env.TZ = process.env.TZ ?? 'GMT'
			return mergeConfig(
				{
					test: {
						...configDefaults.test,
						include: options?.includeGeneralTests
							? [...configDefaults.include.testGeneral, ...configDefaults.include.testBrowser]
							: configDefaults.include.testBrowser,
						browser: {
							enabled: true,
							headless: true,
							provider: 'playwright',
							screenshotFailures: false,
							...(userConfig?.test?.browser?.instances
								? undefined
								: {
										instances: [
											{
												name: (userConfig?.test?.name ? `${userConfig?.test?.name} (chromium)` : undefined) as string,
												browser: 'chromium',
											},
										],
									}),
						},
						coverage: {
							include: configDefaults.include.source,
							exclude: configDefaults.exclude.test,
						},
					},
				} satisfies ViteUserConfig,
				userConfig,
			)
		},
	}
}
