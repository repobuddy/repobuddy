import { defineProject } from 'vitest/config'

export default defineProject({
	esbuild: { jsx: 'automatic' },
	test: {
		name: 'vitest:node',
		environment: 'node',
		include: ['src/**/*.{spec,test,unit,accept,integrate,system}.{js,mjs,cjs,ts,mts,cts}'],
		exclude: ['src/test-setup'],
	},
})
