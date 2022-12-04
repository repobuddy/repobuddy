import { withChalk } from '@repobuddy/jest'
import preset from '@repobuddy/jest/presets/ts-esm'

console.log('preset', preset)
console.log(`withChalk(preset)`, withChalk(preset))

/** @type {import('jest').Config} */
export default {
  ...withChalk(preset),
  // transform: preset.transform,
  // preset: '@repobuddy/jest/presets/ts-esm',
  roots: ['<rootDir>/ts']
}
