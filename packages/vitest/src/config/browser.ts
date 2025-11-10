import { playwright } from '@vitest/browser-playwright'
import type { ViteUserConfig } from 'vitest/config'
import { buddyConfigDefaults } from './buddy_config_defaults.ts'
import type { PresetOptions } from './types.ts'

/**
 * Configures Vitest for browser-based testing using Playwright.
 * @returns A Vite plugin with the browser test configuration.
 */
export function browserTestPreset(options?: PresetOptions | undefined) {
	return {
		name: '@repobuddy/vitest/browser-preset',
		config(userConfig?: ViteUserConfig | undefined) {
			return {
				test: {
					...buddyConfigDefaults.test,
					include: options?.includeGeneralTests
						? [...buddyConfigDefaults.include.testGeneral, ...buddyConfigDefaults.include.testBrowser]
						: buddyConfigDefaults.include.testBrowser,
					browser: {
						enabled: true,
						headless: true,
						provider: playwright() as any,
						...(userConfig?.test?.browser?.instances
							? undefined
							: {
									instances: [
										{
											name: (userConfig?.test?.name ? `${userConfig?.test?.name} (chromium)` : undefined) as string,
											browser: 'chromium',
											screenshotFailures: false,
										},
									],
								}),
					},
					coverage: {
						include: buddyConfigDefaults.include.source,
						exclude: buddyConfigDefaults.exclude.test,
					},
					setupFiles: ['@repobuddy/vitest/setup/browser'],
				},
			} satisfies ViteUserConfig
		},
	}
}
