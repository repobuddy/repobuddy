import { Config } from 'jest'
import { tsEsm, nodejs, watch } from '../../config.js'

const presets: Config = {
  ...tsEsm,
  ...nodejs,
  ...watch
}
export default presets

export { nodejs, tsEsm, watch }
