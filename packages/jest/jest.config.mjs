// `jest` loading mechanism has some issues,
// causing dogfooding of `@repobuddy/jest` to be difficult.
// What I observed is that when the import is 2+ levels deep,
// the import is not resolved correctly.
// it starts failing with `Cannot find module` error.
// To work around it, I have to re-export the imports,
// which I don't want to do.
// So for now, the config is expanded here.

/** @type {import('jest').Config} */
export default {
  collectCoverageFrom: ['<rootDir>/ts/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}'],
  coveragePathIgnorePatterns: [
    '(spec|test|unit|accept|integrate|system)(\\.node)?\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$',
    '(spec|test|unit|accept|integrate|system)\\.node14\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
    '(spec|test|unit|accept|integrate|system)\\.node15\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
    '(spec|test|unit|accept|integrate|system)\\.node16\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
    '(spec|test|unit|accept|integrate|system)\\.node17\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
    '(spec|test|unit|accept|integrate|system)\\.node18\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$'
  ],
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  testEnvironment: 'node',
  testRegex: [
    '(spec|test|unit|accept|integrate|system)(\\.node)?\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$',
    '(spec|test|unit|accept|integrate|system)\\.node14\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
    '(spec|test|unit|accept|integrate|system)\\.node15\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
    '(spec|test|unit|accept|integrate|system)\\.node16\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
    '(spec|test|unit|accept|integrate|system)\\.node17\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$',
    '(spec|test|unit|accept|integrate|system)\\.node18\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$'
  ],
  resolver: './cjs/resolver.js',
  roots: ['<rootDir>/ts'],
  transform: {
    '^.+\\.(ts|tsx|cts|mts)$': ['ts-jest', [{
      isolatedModules: true,
      useESM: true,
      diagnostics: {
        // https://github.com/kulshekhar/ts-jest/issues/3820
        ignoreCodes: [151001]
      }
    }]],
    '\\.m?jsx?$': 'jest-esm-transformer-2'
  },
  transformIgnorePatterns: [],
  watchPlugins: [
    'jest-watch-suspend',
    ['jest-watch-toggle-config-2', { setting: 'collectCoverage' }],
    ['jest-watch-toggle-config-2', { setting: 'verbose' }],
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
}
