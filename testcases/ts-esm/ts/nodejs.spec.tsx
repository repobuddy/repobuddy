import { expect, it } from '@jest/globals'
import { filename } from 'dirname-filename-esm'
import type { SomeType } from './types.js'

it(`${filename(import.meta)} executed`, () => {
	const x: SomeType = 'hello'
	expect(x).toBe('hello')
})
