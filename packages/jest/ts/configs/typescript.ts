import type { Config } from 'jest'
import {
  defineTransform,
  knownExtensionsToTreatAsEsm,
  knownModuleNameMappers,
  knownTransforms
} from '../fields/index.js'

export const tsEsm = {
  extensionsToTreatAsEsm: knownExtensionsToTreatAsEsm.ts,
  moduleNameMapper: knownModuleNameMappers.tsEsm,
  ...defineTransform(knownTransforms.tsJestEsm())
} satisfies Config

export const tsCjs = {
  ...defineTransform(knownTransforms.tsJestCjs()),
  transformIgnorePatterns: []
} satisfies Config
