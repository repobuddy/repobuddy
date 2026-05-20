import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		include: ['ts/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.{ts,mts,cts}'],
		coverage: {
			include: ['ts/**/*.{ts,mts,cts}'],
			exclude: ['ts/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.{ts,mts,cts}'],
		},
	},
})
