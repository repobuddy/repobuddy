import type { Config } from 'jest'
import { configSourceDir, jsEsm } from '../../config.js'
import { node } from '../../configs/index.js'
import { defineWatchPlugins } from '../../watchPlugins.js'

const jsEsmPreset = {
  ...jsEsm,
  ...configSourceDir(),
  ...node,
  ...defineWatchPlugins()
} satisfies Config

export default jsEsmPreset

// need to export all imports for dogfooding to work
// looks like a bug in `jest`
export { configSourceDir, jsEsm, node as nodejs, defineWatchPlugins }
