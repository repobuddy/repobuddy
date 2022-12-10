import type { Config } from 'jest'
import { configSourceDir, nodejs, tsEsm } from '../../config.js'
import { defineWatchPlugins } from '../../watchPlugins.js'

const tsEsmPreset = {
  ...tsEsm,
  ...configSourceDir(),
  resolver: '@repobuddy/jest/resolver',
  ...nodejs,
  ...defineWatchPlugins()
} satisfies Config

export default tsEsmPreset

export { configSourceDir, nodejs, tsEsm, defineWatchPlugins }
