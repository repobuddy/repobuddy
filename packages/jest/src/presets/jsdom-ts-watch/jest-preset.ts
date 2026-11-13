import { readPackageUpSync } from '../../utils/read_package_up.js'
import jsdomTsCjsWatchPreset from '../jsdom-ts-cjs-watch/jest-preset.js'
import jsdomTsEsmWatchPreset from '../jsdom-ts-esm-watch/jest-preset.js'

const pjson = readPackageUpSync()
const jsdomTsWatchPreset = pjson?.packageJson['type'] === 'module' ? jsdomTsEsmWatchPreset : jsdomTsCjsWatchPreset

export default jsdomTsWatchPreset
