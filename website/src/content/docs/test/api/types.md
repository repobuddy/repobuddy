---
title: Types
description: OrderApi, ExpectWithOrder, and the AssertOrder and InvalidOrder classes re-exported from assertron.
---

## `OrderApi`

The type of [`order`](/repobuddy/test/api/install-order/#order) and of `expect.order`.

```ts
interface OrderApi {
	plan(steps?: number): AssertOrder
}
```

`plan(steps)` returns an `AssertOrder` that expects `steps` steps. Omit `steps` for an unplanned instance.

## `ExpectWithOrder`

The shape that [`installOrder`](/repobuddy/test/api/install-order/) adds to `expect`. Use it to augment a runner's
`expect` type.

```ts
interface ExpectWithOrder {
	order: OrderApi
}
```

For Jest, the interface to extend depends on where your `expect` comes from (checked with Jest 30 and TypeScript
7.0.2):

```ts
// `expect` imported from '@jest/globals'
import type { ExpectWithOrder } from '@repobuddy/test'

declare module 'expect' {
	interface BaseExpect extends ExpectWithOrder {}
}
```

```ts
// global `expect` typed by @types/jest
import type { ExpectWithOrder } from '@repobuddy/test'

declare global {
	namespace jest {
		interface Expect extends ExpectWithOrder {}
	}
}
```

For Vitest, `@repobuddy/vitest/setup/order` does this for you.

## `AssertOrder`

A class re-exported from [`assertron`](https://github.com/cyberuni/assertron) (`^11.7.0`). `plan()` returns one. Steps
start at `1`. Methods, from the `assertron` 11.7.0 typings:

| Member | Signature | Effect |
| --- | --- | --- |
| `currentStep` | `number` (getter) | The step it expects next. |
| `once` | `(step: number): void` | Asserts the current step is `step`, then moves to the next step. |
| `is` | `(step: number): void` | Asserts the current step is `step`, without moving. |
| `not` | `(step: number): void` | Asserts the current step is not `step`. |
| `on` | `(step: number, assert: (step: number) => void): void` | Runs `assert` when the order moves past `step`. |
| `any` | `(steps: number[], handler?: (step: number) => void): number` | Asserts the current step is one of `steps`, calls `handler`, moves on, and returns the step. |
| `onAny` | `(steps: number[], ...asserts: Array<(step: number) => unknown>): void` | For each of `steps`, when the order moves past it, passes if any of `asserts` passes. |
| `atLeastOnce` | `(step: number): number` | Asserts `step` runs one or more times. |
| `exactly` | `(step: number, times: number): number` | Asserts `step` runs `times` times. |
| `wait` | `(step: number): Promise<void>` or `(step: number, callback: () => void): void` | Resolves, or calls `callback`, when the order moves past `step`. |
| `jump` | `(step: number): void` | Sets the current step. |
| `move` | `(): void` | Moves to the next step. |
| `end` | `(): number` or `(timeout: number): Promise<number>` | Ends the assertion. See below. |

`end()`:

- For a planned instance, it throws `InvalidOrder` if not every planned step ran. The package's tests show it returns
  `undefined` when the plan is met, although the typings declare `number`.
- For an unplanned instance, it returns a number (the elapsed time).
- With `timeout`, it waits that many milliseconds and then runs the same check.

The package's tests cover `once`, `on`, and `end`. The other rows describe `assertron`'s own surface.

## `InvalidOrder`

A class re-exported from `assertron`. `AssertOrder` throws it when a step runs out of order or when `end()` finds an
unmet plan. It extends `assertron`'s `AssertionError` and carries `state`, `method`, and `args` properties.

```ts
import { InvalidOrder, order } from '@repobuddy/test'

const o = order.plan(1)
try {
	o.once(2)
} catch (e) {
	e instanceof InvalidOrder // true
	// message: Expecting 'is(1)', 'once(1)', 'any([1])', but received 'once(2)'
}
```

## Related

- [`installOrder()`](/repobuddy/test/api/install-order/)
- [Use `expect.order` with Jest](/repobuddy/test/guides/expect-order-with-jest/)
