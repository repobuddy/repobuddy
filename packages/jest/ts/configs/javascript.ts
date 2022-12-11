import type { Config } from 'jest'
import { defineTransform, knownExtensionsToTreatAsEsm, knownTransforms } from '../fields/index.js'

export const jsEsm = {
  extensionsToTreatAsEsm: knownExtensionsToTreatAsEsm.js
} satisfies Config

export const jsCjs = {
  ...defineTransform(knownTransforms.esmPackages())
} satisfies Config
