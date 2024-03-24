import { expect, it } from '@jest/globals'
import type { SomeType } from './not_a_spec.js'

it('hello world', () => {
	const x: SomeType = 'hello world'
	expect(x).toBe('hello world')
})
