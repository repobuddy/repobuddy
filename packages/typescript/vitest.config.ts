import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		include: ['src/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.{ts,mts,cts}'],
		coverage: {
			include: ['src/**/*.{ts,mts,cts}'],
			exclude: ['src/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.{ts,mts,cts}'],
		},
	},
})
