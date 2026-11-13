import { readPackageUpSync } from '../../utils/read_package_up.js'
import tsCjsPreset from '../ts-cjs/jest-preset.js'
import tsEsmPreset from '../ts-esm/jest-preset.js'

const pjson = readPackageUpSync()
const tsPreset = pjson?.packageJson['type'] === 'module' ? tsEsmPreset : tsCjsPreset

export default tsPreset
