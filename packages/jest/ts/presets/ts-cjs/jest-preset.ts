import { Config } from 'jest'
import { tsCjs, nodejs, watch } from '../../config.js'

const presets: Config = {
  ...tsCjs,
  ...nodejs,
  ...watch
}
export default presets

export { nodejs, tsCjs, watch }
