import type { ViteUserConfig } from 'vitest/config'
import { configDefaults } from './config-defaults.ts'
import type { PresetOptions } from './types.ts'

/**
 * Configures Vitest for browser-based testing using Playwright.
 * @returns A Vite plugin with the browser test configuration.
 */
export function browserTestPreset(options?: PresetOptions | undefined) {
	return {
		name: '@repobuddy/vitest/browser-preset',
		config(userConfig?: ViteUserConfig | undefined): any {
			return {
				test: {
					...configDefaults.test,
					include: options?.includeGeneralTests
						? [...configDefaults.include.testGeneral, ...configDefaults.include.testBrowser]
						: configDefaults.include.testBrowser,
					browser: {
						enabled: true,
						provider: 'playwright',
						...(userConfig?.test?.browser?.instances
							? undefined
							: {
									instances: [
										{
											name: (userConfig?.test?.name ? `${userConfig?.test?.name} (chromium)` : undefined) as string,
											browser: 'chromium',
											headless: true,
											screenshotFailures: false,
										},
									],
								}),
					},
					coverage: {
						include: configDefaults.include.source,
						exclude: configDefaults.exclude.test,
					},
					setupFiles: ['@repobuddy/vitest/setup/browser'],
				},
			} satisfies ViteUserConfig
		},
	}
}
