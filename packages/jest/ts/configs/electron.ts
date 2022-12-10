import type { Config } from 'jest'
import { knownTestEnvironments } from '../fields/index.js'

export const electron = {
  runner: '@kayahr/jest-electron-runner/main',
  testEnvironment: knownTestEnvironments.node,
  testMatch: ['**/?*.(spec|test|unit|accept|integrate|system)?(.electron).(js|jsx|cjs|mjs|ts|tsx|cts|mts)']
} satisfies Config

export const electronRenderer = {
  runner: '@kayahr/jest-electron-runner',
  testEnvironment: knownTestEnvironments.electron,
  testMatch: ['**/?*.(spec|test|unit|accept|integrate|system).(js|jsx|cjs|mjs|ts|tsx|cts|mts)']
} satisfies Config
