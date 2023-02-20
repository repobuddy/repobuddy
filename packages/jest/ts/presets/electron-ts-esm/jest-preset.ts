import type { Config } from 'jest'
import { configSource, electron, tsEsm } from '../../configs/index.js'

const preset = {
  ...tsEsm,
  ...configSource(),
  ...electron,
} satisfies Config

export default preset
