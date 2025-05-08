import { expect, it } from 'vitest'
import { isRunningInTest } from '../index.ts'

it('detects the code is running in test runner directly', () => {
	expect(isRunningInTest()).toBe(true)
})
