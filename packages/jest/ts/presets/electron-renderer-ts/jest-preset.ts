import { sync } from 'read-pkg-up'
import cjs from '../electron-renderer-ts-cjs/jest-preset.js'
import esm from '../electron-renderer-ts-esm/jest-preset.js'

const pjson = sync()
const preset = pjson?.packageJson.type === 'module' ? esm : cjs

export default preset
