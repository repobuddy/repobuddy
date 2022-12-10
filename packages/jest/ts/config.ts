import type { Config } from 'jest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineTransform, knownExtensionsToTreatAsEsm, knownTransforms } from './fields/index.js'

export const electron = {
  runner: '@kayahr/jest-electron-runner/main',
  testEnvironment: 'node',
  testMatch: ['**/?*.(spec|test|unit|accept|integrate|system)?(.electron).(js|jsx|cjs|mjs|ts|tsx|cts|mts)']
} satisfies Config

export const electronRenderer = {
  runner: '@kayahr/jest-electron-runner',
  testEnvironment: '@kayahr/jest-electron-runner/environment',
  testMatch: ['**/?*.(spec|test|unit|accept|integrate|system).(js|jsx|cjs|mjs|ts|tsx|cts|mts)']
} satisfies Config

export const jsdom = {
  testEnvironment: 'jsdom',
  testMatch: ['**/?*.(spec|test|unit|accept|integrate|system)?(.jsdom).(js|jsx|cjs|mjs|ts|tsx|cts|mts)']
} satisfies Config

export const jsEsm = {
  extensionsToTreatAsEsm: knownExtensionsToTreatAsEsm.js
} satisfies Config

export const tsEsm = {
  extensionsToTreatAsEsm: knownExtensionsToTreatAsEsm.ts,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  ...defineTransform(knownTransforms.tsJestEsm())
} satisfies Config

export const tsCjs = defineTransform(knownTransforms.tsJestCjs())

/**
 * Configure the source directory of the project
 */
export function configSourceDir(dir?: string) {
  dir = ['src', 'source', 'ts', 'js'].find((dir) => existsSync(resolve(dir))) ?? 'src'
  return {
    collectCoverageFrom: [`<rootDir>/${dir}/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}`],
    roots: [`<rootDir>/${dir}`]
  } satisfies Config
}
