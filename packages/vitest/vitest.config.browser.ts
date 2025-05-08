import { defineProject } from 'vitest/config'
import { browserTestPreset } from './src/config/browser.ts'

export default defineProject({
	plugins: [browserTestPreset()],
	esbuild: { jsx: 'automatic' },
	test: {
		name: 'vitest:browser',
	},
})
