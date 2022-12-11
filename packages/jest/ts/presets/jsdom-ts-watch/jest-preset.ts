import { sync } from 'read-pkg-up'
import jsdomTsCjsWatchPreset from '../jsdom-ts-cjs-watch/jest-preset.js'
import jsdomTsEsmWatchPreset from '../jsdom-ts-esm-watch/jest-preset.js'

const pjson = sync()
const jsdomTsWatchPreset = pjson?.packageJson.type === 'module' ? jsdomTsEsmWatchPreset : jsdomTsCjsWatchPreset

export default jsdomTsWatchPreset
