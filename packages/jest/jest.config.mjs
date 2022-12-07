import { withChalk, withTransformEsmPackages } from '@repobuddy/jest'
import preset from '@repobuddy/jest/presets/ts-esm'

const chalkedPreset = withTransformEsmPackages(withChalk(preset, 'cjs'))

// console.log(withChalk)
// console.log(preset)
// console.log(chalkedPreset)

/** @type {import('jest').Config} */
export default {
  ...chalkedPreset,
  resolver: '<rootDir>/cjs/resolver.js',
  roots: ['<rootDir>/ts']
}
