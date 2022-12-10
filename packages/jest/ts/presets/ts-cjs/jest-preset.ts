import type { Config } from 'jest'
import { configSourceDir, tsCjs } from '../../config.js'
import { node } from '../../configs/index.js'
import { defineWatchPlugins } from '../../fields/index.js'
import { withTransformEsmPackages } from '../../withTransformEsmPackages.js'

const tsCjsPreset = withTransformEsmPackages({
  ...tsCjs,
  ...configSourceDir(),
  ...node,
  ...defineWatchPlugins()
}) satisfies Config

export default tsCjsPreset
