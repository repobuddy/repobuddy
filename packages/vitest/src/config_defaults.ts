import { configDefaults as vitestConfigDefaults } from 'vitest/config'

export const configDefaults = {
	...vitestConfigDefaults,
	include: {
		vitestDefault: vitestConfigDefaults.include,
		source: ['{src,source,code}/**/*.{js,mjs,cjs,ts,jsx,tsx,cts,mts}'],
		testGeneral: [
			'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.{js,cjs,mjs,ts,cts,mts}',
		],
		testNode: [
			'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.node*.{js,cjs,mjs,ts,cts,mts}',
		],
		testBrowser: [
			'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.{jsx,tsx}',
			'{src,source,code,tests}/**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.browser*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
		],
	},
	exclude: {
		vitestDefault: vitestConfigDefaults.exclude,
		test: [
			'**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
			'**/*.{spec,test,unit,accept,integrate,system,perf,stress,study}.*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}',
			'**/*.stories.{js,mjs,jsx,tsx}',
		],
	},
	test: {
		expect: {
			poll: {
				timeout: 5000,
			},
		},
		server: {
			deps: {
				// this allows `vitest` to use CJS for packages without ESM.
				fallbackCJS: true,
			},
		},
		testTimeout: 30000,
	},
}
