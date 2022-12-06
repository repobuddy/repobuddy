import type { Config } from 'jest'
import { jsEsm, nodejs, watch } from '../../config.js'

const presets: Config = {
  ...jsEsm,
  ...nodejs,
  ...watch
}
export default presets

export { jsEsm, nodejs, watch }
