import type { Config } from 'jest'
import { configSource, electron, tsCjs } from '../../configs/index.js'
import { defineWatchPlugins } from '../../fields/index.js'

const preset = {
  ...tsCjs,
  ...configSource(),
  ...electron,
  ...defineWatchPlugins()
} satisfies Config

export default preset
