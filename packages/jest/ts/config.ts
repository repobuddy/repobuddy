import type { Config } from 'jest'

export const electron = {
  runner: '@kayahr/jest-electron-runner/main',
  testEnvironment: 'node',
  testMatch: ['**/?*.(spec|test|unit|accept|integrate|system)?(.electron).(js|jsx|cjs|mjs|ts|tsx|cts|mts)'],
} satisfies Config

export const electronRenderer = {
  runner: '@kayahr/jest-electron-runner',
  testEnvironment: '@kayahr/jest-electron-runner/environment',
  testMatch: ['**/?*.(spec|test|unit|accept|integrate|system).(js|jsx|cjs|mjs|ts|tsx|cts|mts)'],
} satisfies Config

export const jsdom = {
  testEnvironment: 'jsdom',
  testMatch: ['**/?*.(spec|test|unit|accept|integrate|system)?(.jsdom).(js|jsx|cjs|mjs|ts|tsx|cts|mts)'],
} satisfies Config

export const nodejs = createNodejsConfig()

export function createNodejsConfig(
  identifiers = ['spec', 'test', 'unit', 'accept', 'integrate', 'system'],
  minNodeVersion = 14,
) {
  const id = identifiers.join('|')
  const nodeMajorVersion = parseInt(process.version.slice(1, process.version.indexOf('.')), 10)
  const nodeVersions = Array.from(new Array(nodeMajorVersion - minNodeVersion + 1), (_, i) => i + minNodeVersion)

  return {
    testEnvironment: 'node',
    testRegex: [`(${id})(\\.node)?\\.(js|jsx|cjs|mjs|ts|tsx|cts|mts)$`]
      .concat(nodeVersions.map((v) => `(${id})\\.node${v}\\.(js|jtx|cjs|mjs|ts|tsx|cts|mts)$`))
  } satisfies Config
}

export const jsEsm = {
  extensionsToTreatAsEsm: ['.jsx'],
} satisfies Config

export const tsEsm = {
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.mts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(ts|tsx|cts|mts)$': ['ts-jest', {
      isolatedModules: true,
      useESM: true,
      diagnostics: {
        // https://github.com/kulshekhar/ts-jest/issues/3820
        ignoreCodes: [151001]
      }
    }],
  },
} satisfies Config

export const tsCjs = {
  transform: {
    '^.+\\.(ts|tsx|cts|mts)$': ['ts-jest', {
      isolatedModules: true
    }],
  },
} satisfies Config

export const watch = {
  watchPlugins: [
    'jest-watch-suspend',
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    [
      'jest-watch-toggle-config', { 'setting': 'verbose' }
    ],
    [
      'jest-watch-toggle-config', { 'setting': 'collectCoverage' }
    ]
  ]
} satisfies Config
