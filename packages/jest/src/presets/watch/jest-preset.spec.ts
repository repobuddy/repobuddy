import { expect, it } from '@jest/globals'
import preset from './jest-preset.js'

it('is defined', () => {
	expect(preset).toBeDefined()
})
