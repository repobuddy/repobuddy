import type { Config } from 'jest'
import { configSourceDir } from '../../config.js'
import { node } from '../../configs/index.js'
import { defineWatchPlugins } from '../../watchPlugins.js'

const jsCjsPreset = {
  ...configSourceDir(),
  ...node,
  ...defineWatchPlugins()
} satisfies Config

export default jsCjsPreset

// need to export all imports for dogfooding to work
// looks like a bug in `jest`
export { configSourceDir, node as nodejs, defineWatchPlugins }
