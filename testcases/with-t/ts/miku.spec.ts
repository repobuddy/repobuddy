import { expect, it } from '@jest/globals'
import { somethingForTest } from './testing.js'

it('imports from testing', () => {
	expect(somethingForTest).toBe(1)
})
