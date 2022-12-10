import type { Config } from 'jest'
import { configSourceDir, tsCjs } from '../../config.js'
import { node } from '../../configs/index.js'
import { defineWatchPlugins } from '../../watchPlugins.js'
import { withTransformEsmPackages } from '../../withTransformEsmPackages.js'

const tsCjsPreset = withTransformEsmPackages({
  ...tsCjs,
  ...configSourceDir(),
  ...node,
  ...defineWatchPlugins()
}) satisfies Config

export default tsCjsPreset

// need to export all imports for dogfooding to work
// looks like a bug in `jest`
export { configSourceDir, withTransformEsmPackages, node as nodejs, tsCjs, defineWatchPlugins }
