import type { Config } from 'jest'
import { configSourceDir, nodejs, tsCjs } from '../../config.js'
import { defineWatchPlugins } from '../../watchPlugins.js'
import { withTransformEsmPackages } from '../../withTransformEsmPackages.js'

const tsCjsPreset = withTransformEsmPackages({
  ...tsCjs,
  ...configSourceDir(),
  resolver: '@repobuddy/jest/resolver',
  ...nodejs,
  ...defineWatchPlugins()
}) satisfies Config

export default tsCjsPreset

export { configSourceDir, withTransformEsmPackages, nodejs, tsCjs, defineWatchPlugins }
