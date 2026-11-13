import { readPackageUpSync } from '../../utils/read_package_up.js'
import jsdomTsCjsPreset from '../jsdom-ts-cjs/jest-preset.js'
import jsdomTsEsmPreset from '../jsdom-ts-esm/jest-preset.js'

const pjson = readPackageUpSync()
const jsdomTsPreset = pjson?.packageJson['type'] === 'module' ? jsdomTsEsmPreset : jsdomTsCjsPreset

export default jsdomTsPreset
