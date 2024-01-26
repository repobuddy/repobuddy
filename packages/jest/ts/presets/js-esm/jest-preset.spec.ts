import { describe, expect, it } from '@jest/globals'
import preset from './jest-preset.js'

describe(`js-esm preset`, () => {
	it('is defined', () => {
		expect(preset).toBeDefined()
	})
})
