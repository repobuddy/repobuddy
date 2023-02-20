import { sync } from 'read-pkg-up'
import electronTsCjsPreset from '../electron-ts-cjs/jest-preset.js'
import electronTsEsmPreset from '../electron-ts-esm/jest-preset.js'

const pjson = sync()
const preset = pjson?.packageJson.type === 'module' ? electronTsEsmPreset : electronTsCjsPreset

export default preset
