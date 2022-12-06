import type { Config } from 'jest'
import { configSourceDir, jsEsm, nodejs, watch } from '../../config.js'

const jsEsmPreset = {
  ...jsEsm,
  ...configSourceDir(),
  ...nodejs,
  ...watch
} satisfies Config

export default jsEsmPreset

export { configSourceDir, jsEsm, nodejs, watch }
