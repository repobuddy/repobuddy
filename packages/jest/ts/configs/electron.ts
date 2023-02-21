import type { Config } from 'jest'
import { knownRunners, knownTestEnvironments } from '../fields/index.js'

export const electron = {
  runner: knownRunners.electron,
  testEnvironment: knownTestEnvironments.node,
  testMatch: ['**/?*\\.(spec|test|unit|accept|integrate|system)?(.electron).(js|jsx|cjs|mjs|ts|tsx|cts|mts)']
} satisfies Config

export const electronRenderer = {
  runner: knownRunners.electronRenderer,
  testEnvironment: knownTestEnvironments.electron,
  testMatch: ['**/?*\\.(spec|test|unit|accept|integrate|system)?(.electron_renderer).(js|jsx|cjs|mjs|ts|tsx|cts|mts)']
} satisfies Config
