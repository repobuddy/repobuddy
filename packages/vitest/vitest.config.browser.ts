import { defineProject } from 'vitest/config'

export default defineProject({
	esbuild: { jsx: 'automatic' },
	test: {
		name: 'vitest:browser',
		browser: {
			enabled: true,
			headless: true,
			instances: [{ browser: 'chromium', screenshotFailures: false }],
			provider: 'playwright',
		},
		include: ['src/**/*.{spec,test,unit,accept,integrate,system}.{jsx,tsx}'],
	},
})
