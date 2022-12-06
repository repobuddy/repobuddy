import { Config } from 'jest'
import { configSourceDir, nodejs, tsEsm, watch } from '../../config.js'

const presets = {
  ...tsEsm,
  ...configSourceDir(),
  ...nodejs,
  ...watch
} satisfies Config

export default presets

export { configSourceDir, nodejs, tsEsm, watch }
