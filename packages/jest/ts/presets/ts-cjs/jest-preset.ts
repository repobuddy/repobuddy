import type { Config } from 'jest'
import { configSourceDir, tsCjs } from '../../config.js'
import { node } from '../../configs/index.js'
import { defineWatchPlugins } from '../../fields/index.js'

const tsCjsPreset = {
  ...tsCjs,
  ...configSourceDir(),
  ...node,
  ...defineWatchPlugins(),
} satisfies Config

export default tsCjsPreset
