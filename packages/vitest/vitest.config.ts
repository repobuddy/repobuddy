import { defineConfig } from 'vitest/config'
import { configDefaults } from './src/config/config-defaults'

export default defineConfig({
	test: {
		coverage: {
			include: configDefaults.include.source,
			exclude: configDefaults.exclude.test,
		},
		workspace: ['vitest.config.*.ts'],
	},
})
