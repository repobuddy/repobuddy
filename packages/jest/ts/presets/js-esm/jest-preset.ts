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
