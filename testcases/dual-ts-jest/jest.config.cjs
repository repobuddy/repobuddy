const { fields } = require('@repobuddy/jest')

/** @type {import('jest').Config} */
module.exports = {
	// preset: '@repobuddy/jest/presets/ts',
	detectOpenHandles: true,
	transform: {
		...fields.knownTransforms.tsJestEsm({
			tsconfig: 'tsconfig.esm.json',
		}),
		...fields.knownTransforms.esmPackages(),
	},
	testPathIgnorePatterns: ['/node_modules/'],
	testRegex: [
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)(\\.node)?\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$',
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)\\.node14\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)\\.node15\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)\\.node16\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)\\.node17\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)\\.node18\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)\\.node19\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
		'\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)\\.node20\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
	],
	moduleFileExtensions: ['js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'json', 'node'],
	moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
	extensionsToTreatAsEsm: ['.ts', '.mts', '.tsx'],
}
