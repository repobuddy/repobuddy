import { InvalidOrder } from '@repobuddy/test'
import { expect, it } from 'vitest'
import './order.ts'

it('adds order to expect', () => {
	const o = expect.order.plan(2)
	o.once(1)
	o.once(2)
	o.end()
})

it('throws when the code runs out of order', () => {
	const o = expect.order.plan(2)
	o.once(1)
	expect(() => o.once(1)).toThrow(InvalidOrder)
})

it('throws at end() when the plan is not fulfilled', () => {
	const o = expect.order.plan(3)
	o.once(1)
	expect(() => o.end()).toThrow(InvalidOrder)
})
