import type { Config } from 'jest'
import { configSource, electron, tsCjs } from '../../configs/index.js'

const preset = {
  ...tsCjs,
  ...configSource(),
  ...electron
} satisfies Config

export default preset
