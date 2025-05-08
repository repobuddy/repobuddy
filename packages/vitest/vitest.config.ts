import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		coverage: {
			include: ['src/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		},
		workspace: ['vitest.config.*.ts'],
	},
})
