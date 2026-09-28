import { expect, it } from 'vitest'
import { installOrder, order } from '../index.ts'

it('adds order to expect', () => {
	const e = installOrder(((..._args: unknown[]) => {}) as object)
	expect((e as any).order).toBe(order)
})

it('returns the same expect', () => {
	const e = {}
	expect(installOrder(e)).toBe(e)
})

it('keeps order non-enumerable so expect is not reshaped', () => {
	const e = installOrder({})
	expect(Object.keys(e)).toEqual([])
})

it('installs onto the real expect', () => {
	installOrder(expect)
	const o = (expect as any).order.plan(1)
	o.once(1)
	o.end()
})
