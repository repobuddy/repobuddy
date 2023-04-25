import { sync } from 'read-pkg-up'
import electronTsCjsWatchPreset from '../electron-ts-cjs-watch/jest-preset.js'
import electronTsEsmWatchPreset from '../electron-ts-esm-watch/jest-preset.js'

const pjson = sync()
const preset = pjson?.packageJson['type'] === 'module' ? electronTsEsmWatchPreset : electronTsCjsWatchPreset

export default preset
