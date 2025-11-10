import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		coverage: {
			include: ['{src,source,code}/**/*.{js,mjs,cjs,ts,jsx,tsx,cts,mts}'],
			exclude: [
				'**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
				'**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
				'**/*.stories.{js,mjs,jsx,tsx}',
			],
		},
		projects: ['vitest.config.*.ts'],
	},
})
