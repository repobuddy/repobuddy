import { Config } from 'jest'
import { configSourceDir, nodejs, watch } from '../../config.js'

const presets: Config = {
  ...configSourceDir(),
  ...nodejs,
  ...watch
}
export default presets

export { configSourceDir, nodejs, watch }
