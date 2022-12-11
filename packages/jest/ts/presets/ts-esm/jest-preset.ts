import type { Config } from 'jest'
import { configSourceDir } from '../../config.js'
import { node, tsEsm } from '../../configs/index.js'
import { defineWatchPlugins } from '../../fields/index.js'

const tsEsmPreset = {
  ...tsEsm,
  ...configSourceDir(),
  ...node,
  ...defineWatchPlugins()
} satisfies Config

export default tsEsmPreset
