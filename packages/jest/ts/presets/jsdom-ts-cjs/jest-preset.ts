import type { Config } from 'jest'
import { configSource, jsdom, tsCjs } from '../../configs/index.js'

const jsdomTsCjsPreset = {
  ...tsCjs,
  ...configSource(),
  ...jsdom,
} satisfies Config

export default jsdomTsCjsPreset
