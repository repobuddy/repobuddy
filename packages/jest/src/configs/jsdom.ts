import type { Config } from 'jest'
import { knownTestEnvironments } from '../fields/index.js'

export const jsdom = {
	testEnvironment: knownTestEnvironments.jsdom,
	testMatch: [
		'**/?*\\.(spec|test|unit|accept|integrate|learning|system|perf|stress)?(.jsdom).(js|jsx|cjs|mjs|ts|tsx|cts|mts)',
	],
} satisfies Config
