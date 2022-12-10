import type { Config } from 'jest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineTransform, knownExtensionsToTreatAsEsm, knownTransforms } from './fields/index.js'

export const jsEsm = {
  extensionsToTreatAsEsm: knownExtensionsToTreatAsEsm.js
} satisfies Config

export const jsCjs = {
  ...defineTransform(knownTransforms.esmPackages()),
} satisfies Config

export const tsEsm = {
  extensionsToTreatAsEsm: knownExtensionsToTreatAsEsm.ts,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  ...defineTransform(knownTransforms.tsJestEsm())
} satisfies Config

export const tsCjs = {
  ...defineTransform(knownTransforms.tsJestCjs()),
  transformIgnorePatterns: []
} satisfies Config

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
