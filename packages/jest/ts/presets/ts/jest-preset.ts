import { sync } from 'read-pkg-up'
import tsCjsPreset from '../ts-cjs/jest-preset.js'
import tsEsmPreset from '../ts-esm/jest-preset.js'

const pjson = sync()
const tsPreset = pjson?.packageJson.type === 'module' ? tsEsmPreset : tsCjsPreset

export default tsPreset
