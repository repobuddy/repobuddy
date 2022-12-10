import type { Config } from 'jest'
import { configSourceDir, jsEsm, nodejs } from '../../config.js'
import { defineWatchPlugins } from '../../watchPlugins.js'

const jsEsmPreset = {
  ...jsEsm,
  ...configSourceDir(),
  resolver: '@repobuddy/jest/resolver',
  ...nodejs,
  ...defineWatchPlugins()
} satisfies Config

export default jsEsmPreset

export { configSourceDir, jsEsm, nodejs, defineWatchPlugins }
