import type { Config } from 'jest'
import { defineTransform, knownExtensionsToTreatAsEsm, knownTransforms } from '../fields/index.js'

export const jsCjs = {
  ...defineTransform(knownTransforms.esmPackages()),
  transformIgnorePatterns: []
} satisfies Config

export const jsEsm = {
  extensionsToTreatAsEsm: knownExtensionsToTreatAsEsm.js
} satisfies Config
