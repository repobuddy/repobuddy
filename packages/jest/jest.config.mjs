import { withTransformEsmPackages } from '@repobuddy/jest'
import preset from '@repobuddy/jest/presets/ts-esm'

const chalkedPreset = withTransformEsmPackages(preset)

/** @type {import('jest').Config} */
export default {
  ...chalkedPreset,
}
