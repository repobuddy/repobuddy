import type { Config } from 'jest'
import { configSourceDir, nodejs, tsEsm, watch } from '../../config.js'

const tsEsmPreset = {
  ...tsEsm,
  ...configSourceDir(),
  ...nodejs,
  ...watch
} satisfies Config

export default tsEsmPreset

export { configSourceDir, nodejs, tsEsm, watch }
