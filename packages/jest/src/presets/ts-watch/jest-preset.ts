import { sync } from 'read-pkg-up'
import tsCjsWatchPreset from '../ts-cjs-watch/jest-preset.js'
import tsEsmWatchPreset from '../ts-esm-watch/jest-preset.js'

const pjson = sync()
const tsWatchPreset = pjson?.packageJson['type'] === 'module' ? tsEsmWatchPreset : tsCjsWatchPreset

export default tsWatchPreset
