import { expect, it } from '@jest/globals'
import { presets } from './index.js'

it('exports presets', () => {
	expect(presets.jsCjs).toBeDefined()
	expect(presets.jsEsm).toBeDefined()
	expect(presets.tsCjs).toBeDefined()
	expect(presets.tsEsm).toBeDefined()
})
