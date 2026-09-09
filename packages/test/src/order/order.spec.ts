import { expect, it } from 'vitest'
import { AssertOrder, InvalidOrder, order } from '../index.ts'

it('creates an AssertOrder', () => {
	expect(order.plan()).toBeInstanceOf(AssertOrder)
})

it('asserts steps run in order', () => {
	const o = order.plan(2)
	o.once(1)
	o.once(2)
	expect(o.end()).toBeUndefined()
})

it('throws when a step runs out of order', () => {
	const o = order.plan(2)
	o.once(1)
	expect(() => o.once(1)).toThrow(InvalidOrder)
})

it('throws at end() when the plan is not fulfilled', () => {
	const o = order.plan(2)
	o.once(1)
	expect(() => o.end()).toThrow(InvalidOrder)
})

it('creates an unplanned AssertOrder when no plan is given', () => {
	const o = order.plan()
	o.once(1)
	expect(typeof o.end()).toBe('number')
})

it('exposes the rest of the AssertOrder surface', () => {
	const o = order.plan(2)
	o.on(2, (step) => {
		expect(step).toBe(2)
	})
	o.once(1)
	o.once(2)
	o.end()
})
