import { sync } from 'read-pkg-up'
import jsdomTsCjsPreset from '../jsdom-ts-cjs/jest-preset.js'
import jsdomTsEsmPreset from '../jsdom-ts-esm/jest-preset.js'

const pjson = sync()
const jsdomTsPreset = pjson?.packageJson['type'] === 'module' ? jsdomTsEsmPreset : jsdomTsCjsPreset

export default jsdomTsPreset
