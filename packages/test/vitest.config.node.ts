import { defineProject } from 'vitest/config'

export default defineProject({
	test: {
		name: 'test:node',
		environment: 'node',
		include: [
			'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.{js,cjs,mjs,ts,cts,mts}',
			'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.node*.{js,cjs,mjs,ts,cts,mts}',
		],
		server: {
			deps: {
				fallbackCJS: true,
			},
		},
	},
})
