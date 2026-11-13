import { readPackageUpSync } from '../../utils/read_package_up.js'
import tsCjsWatchPreset from '../ts-cjs-watch/jest-preset.js'
import tsEsmWatchPreset from '../ts-esm-watch/jest-preset.js'

const pjson = readPackageUpSync()
const tsWatchPreset = pjson?.packageJson['type'] === 'module' ? tsEsmWatchPreset : tsCjsWatchPreset

export default tsWatchPreset
