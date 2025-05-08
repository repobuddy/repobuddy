import { defineConfig } from 'eslint/config'
import eslintPluginYml from 'eslint-plugin-yml'

export default defineConfig([
	{
		ignores: ['testcases/', 'node_modules/', '.turbo/', '**/cjs/', '**/coverage/', '**/esm/', '**/tslib/'],
	},
	...eslintPluginYml.configs['flat/recommended'],
	{
		rules: {
			'yml/quotes': ['error', { prefer: 'single' }],
		},
	},
])
