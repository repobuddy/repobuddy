import type { Config } from 'jest'
import { configSourceDir, nodejs } from '../../config.js'
import { defineWatchPlugins } from '../../watchPlugins.js'

const jsCjsPreset = {
  ...configSourceDir(),
  resolver: '@repobuddy/jest/resolver',
  ...nodejs,
  ...defineWatchPlugins()
} satisfies Config

export default jsCjsPreset

export { configSourceDir, nodejs, defineWatchPlugins }
