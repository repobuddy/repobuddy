import type { Config } from 'jest'
import { configSourceDir, tsEsm } from '../../config.js'
import { node } from '../../configs/index.js'
import { defineWatchPlugins } from '../../watchPlugins.js'

const tsEsmPreset = {
  ...tsEsm,
  ...configSourceDir(),
  ...node,
  ...defineWatchPlugins()
} satisfies Config

export default tsEsmPreset
