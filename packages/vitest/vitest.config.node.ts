import { defineProject } from 'vitest/config'
import { nodeTestPreset } from './src/config/node.ts'

export default defineProject({
	plugins: [nodeTestPreset({ includeGeneralTests: true })],
	test: {
		name: 'vitest:node',
	},
})
