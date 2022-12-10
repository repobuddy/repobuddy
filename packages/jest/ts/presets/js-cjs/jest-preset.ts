import type { Config } from 'jest'
import { configSourceDir, jsCjs } from '../../config.js'
import { node } from '../../configs/index.js'
import { defineWatchPlugins } from '../../fields/index.js'

const jsCjsPreset = {
  ...jsCjs,
  ...configSourceDir(),
  ...node,
  ...defineWatchPlugins()
} satisfies Config

export default jsCjsPreset
