import { AssertOrder } from 'assertron'

export { AssertOrder, InvalidOrder } from 'assertron'

/**
 * Creates {@link AssertOrder} instances to assert code executes in the expected order.
 *
 * @see https://github.com/cyberuni/assertron for the full `AssertOrder` surface.
 */
export interface OrderApi {
	/**
	 * Creates an `AssertOrder` expecting `steps` number of steps.
	 *
	 * `AssertOrder#end()` throws when the planned steps are not all reached.
	 *
	 * @param steps the number of steps to plan for.
	 * Omit it to create an unplanned `AssertOrder`.
	 */
	plan(steps?: number): AssertOrder
}

export const order: OrderApi = {
	plan(steps?: number) {
		return new AssertOrder(steps)
	},
}
