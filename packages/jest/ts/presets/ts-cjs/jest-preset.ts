import type { Config } from 'jest'
import { configSourceDir, nodejs, tsCjs, watch } from '../../config.js'
import { withTransformEsmPackages } from '../../withTransformEsmPackages.js'

const tsCjsPreset = withTransformEsmPackages({
  ...tsCjs,
  ...configSourceDir(),
  resolver: '@repobuddy/jest/resolver',
  ...nodejs,
  ...watch
}) satisfies Config

export default tsCjsPreset

export { configSourceDir, withTransformEsmPackages, nodejs, tsCjs, watch }
