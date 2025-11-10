import storybookTest from '@storybook/experimental-addon-test/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineProject } from 'vitest/config'

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

export default defineProject({
	plugins: [
		storybookTest({
			configDir: path.join(dirname, '.storybook'),
		}),
		{
			name: 'override',
			config() {
				return {
					test: {
						include: [
							'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.{jsx,tsx}',
							'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.browser*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
						],
						expect: { poll: { timeout: 5000 } },
						server: { deps: { fallbackCJS: true } },
						testTimeout: 30000,
					},
				}
			},
		},
	],
	optimizeDeps: {
		include: ['react/jsx-dev-runtime'],
	},
	esbuild: { jsx: 'automatic' },
	test: {
		name: 'test:browser',
		browser: {
			enabled: true,
			provider: playwright(),
			instances: [
				{
					name: 'chromium',
					browser: 'chromium',
					headless: true,
					screenshotFailures: false,
				},
			],
		},
		setupFiles: ['.storybook/vitest.setup.ts'],
	},
})
