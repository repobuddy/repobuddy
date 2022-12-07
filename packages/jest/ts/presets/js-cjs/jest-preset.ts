import type { Config } from 'jest'
import { configSourceDir, nodejs, watch } from '../../config.js'

const jsCjsPreset = {
  ...configSourceDir(),
  resolver: '@repobuddy/jest/resolver',
  ...nodejs,
  ...watch
} satisfies Config

export default jsCjsPreset

export { configSourceDir, nodejs, watch }
