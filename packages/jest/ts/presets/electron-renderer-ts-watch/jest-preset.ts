import { sync } from 'read-pkg-up'
import cjs from '../electron-renderer-ts-cjs-watch/jest-preset.js'
import esm from '../electron-renderer-ts-esm-watch/jest-preset.js'

const pjson = sync()
const preset = pjson?.packageJson['type'] === 'module' ? esm : cjs

export default preset
