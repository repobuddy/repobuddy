import { Config } from 'jest'
import { configSourceDir, jsEsm, nodejs, watch } from '../../config.js'

const presets: Config = {
  ...jsEsm,
  ...configSourceDir(),
  ...nodejs,
  ...watch
}
export default presets

export { configSourceDir, jsEsm, nodejs, watch }
