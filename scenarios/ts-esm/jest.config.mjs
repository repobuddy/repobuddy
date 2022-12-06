import { withChalk } from '@repobuddy/jest'
import preset from '@repobuddy/jest/presets/ts-esm'

const chalkedPreset = withChalk(preset)

// console.log(withChalk)
// console.log(preset)
// console.log(chalkedPreset)

/** @type {import('jest').Config} */
export default {
  ...chalkedPreset
}
