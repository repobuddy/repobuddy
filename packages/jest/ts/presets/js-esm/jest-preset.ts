import { Config } from 'jest'
import { nodejs, watch } from '../../config.js'

const presets: Config = {
  ...nodejs,
  ...watch
}
export default presets

export { nodejs, watch }
