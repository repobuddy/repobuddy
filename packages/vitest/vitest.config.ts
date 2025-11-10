import { defineConfig } from 'vitest/config'
import { buddyConfigDefaults } from './src/config/buddy_config_defaults'

export default defineConfig({
	test: {
		coverage: {
			include: buddyConfigDefaults.include.source,
			exclude: buddyConfigDefaults.exclude.test,
		},
		projects: ['vitest.config.*.ts'],
	},
})
