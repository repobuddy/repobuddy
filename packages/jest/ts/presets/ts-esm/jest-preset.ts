import type { Config } from 'jest'
import { nodejs, tsEsm, watch } from '../../config.js'

const presets = {
  ...tsEsm,
  ...nodejs,
  ...watch
} satisfies Config

export default presets

export { nodejs, tsEsm, watch }
