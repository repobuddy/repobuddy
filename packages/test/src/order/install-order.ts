import { type OrderApi, order } from './order.ts'

/**
 * The shape `installOrder()` adds `order` to.
 *
 * It is intentionally structural so that it accepts the `expect` of any test runner.
 */
export interface ExpectWithOrder {
	order: OrderApi
}

/**
 * Installs `order` onto a test runner's `expect`, enabling `expect.order.plan(x)`.
 *
 * Call it from a setup file. `@repobuddy/vitest` ships `@repobuddy/vitest/setup/order`,
 * which does this and augments `vitest`'s types.
 *
 * For other runners, augment the runner's `expect` type yourself:
 *
 * ```ts
 * import { installOrder } from '@repobuddy/test'
 *
 * declare module '@jest/expect' {
 *   interface Expect extends ExpectWithOrder {}
 * }
 *
 * installOrder(expect)
 * ```
 *
 * @param expect the test runner's `expect`.
 * @returns the same `expect`, now carrying `order`.
 */
export function installOrder<E extends object>(expect: E): E & ExpectWithOrder {
	Object.defineProperty(expect, 'order', {
		configurable: true,
		enumerable: false,
		writable: true,
		value: order,
	})
	return expect as E & ExpectWithOrder
}
