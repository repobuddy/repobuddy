import type { Config } from 'jest'
import { configSourceDir } from '../../config.js'
import { node, tsCjs } from '../../configs/index.js'
import { defineWatchPlugins } from '../../fields/index.js'

const tsCjsPreset = {
  ...tsCjs,
  ...configSourceDir(),
  ...node,
  ...defineWatchPlugins(),
} satisfies Config

export default tsCjsPreset
