import type { Config } from 'jest'
import { defineTransform, knownExtensionsToTreatAsEsm, knownTransforms } from '../fields/index.js'

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
