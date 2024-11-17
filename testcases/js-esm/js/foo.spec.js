import { expect, it } from '@jest/globals'
import { foo } from './foo.js'

it('returns foo', () => {
	expect(foo()).toBe('foo')
})
