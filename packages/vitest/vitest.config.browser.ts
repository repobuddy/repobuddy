import path from 'node:path'
import { fileURLToPath } from 'node:url'
import storybookTest from '@storybook/addon-vitest/vitest-plugin'
import { storybookVis } from 'storybook-addon-vis/vitest-plugin'
import { defineProject } from 'vitest/config'
import { browserTestPreset } from './src/config/browser.ts'

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

export default defineProject({
	plugins: [
		storybookTest({
			configDir: path.join(dirname, '.storybook'),
		}),
		storybookVis(),
		browserTestPreset(),
	],
	optimizeDeps: {
		include: ['react/jsx-dev-runtime'],
	},
	esbuild: { jsx: 'automatic' },
	test: {
		name: 'vitest:browser',
		setupFiles: ['.storybook/vitest.setup.ts'],
	},
})
