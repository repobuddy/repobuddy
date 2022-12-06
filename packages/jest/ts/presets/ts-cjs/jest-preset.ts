import { Config } from 'jest'
import { configSourceDir, nodejs, tsCjs, watch } from '../../config.js'

const presets: Config = {
  ...tsCjs,
  ...configSourceDir(),
  ...nodejs,
  ...watch
}
export default presets

export { configSourceDir, nodejs, tsCjs, watch }

