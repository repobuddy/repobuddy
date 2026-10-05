---
title: installOrder()
description: Adds expect.order to a test runner's expect, for asserting that code runs in a planned order.
---

`installOrder(expect)` defines an `order` property on the `expect` you pass and returns the same object.
`expect.order.plan(n)` then creates an [`AssertOrder`](/repobuddy/test/api/types/#assertorder) that expects `n` steps.

## Signature

```ts
function installOrder<E extends object>(expect: E): E & ExpectWithOrder
```

## Parameters

| Name | Type | Default | Effect |
| --- | --- | --- | --- |
| `expect` | `object` | required | The runner's `expect`. `installOrder` adds `order` to it in place. |

## Returns

The same `expect` object, typed as `E & ExpectWithOrder`.

## Behavior

- It sets `order` with `Object.defineProperty`: not enumerable, writable, and configurable. `Object.keys(expect)` does
  not list it.
- The value is the shared [`order`](#order) object. Every `expect` you install onto gets the same object.
- Calling it twice on one `expect` replaces the property with the same value.
- It does not change the runner's types. Augment them yourself (see
  [`ExpectWithOrder`](/repobuddy/test/api/types/#expectwithorder)) or, with Vitest, use the
  `@repobuddy/vitest/setup/order` setup file.

## `order`

```ts
const order: OrderApi
```

The object that `installOrder` attaches. Use it directly when you do not want to change `expect`.

| Method | Returns | Effect |
| --- | --- | --- |
| `plan(steps?: number)` | `AssertOrder` | `new AssertOrder(steps)`. With `steps`, `end()` throws `InvalidOrder` unless every planned step ran. Without it, the instance is unplanned and `end()` returns a number. |

Steps start at `1`.

## Examples

These examples come from the package's tests.

Steps that run in order pass:

```ts
import { installOrder } from '@repobuddy/test'
import { expect, it } from 'vitest'

installOrder(expect)

it('asserts steps run in order', () => {
	const o = expect.order.plan(2)
	o.once(1)
	o.once(2)
	o.end()
})
```

A step out of order throws `InvalidOrder` at once:

```ts
import { InvalidOrder, order } from '@repobuddy/test'
import { expect, it } from 'vitest'

it('throws when a step runs out of order', () => {
	const o = order.plan(2)
	o.once(1)
	expect(() => o.once(1)).toThrow(InvalidOrder)
})
```

A plan that is not fulfilled throws at `end()`:

```ts
it('throws at end() when the plan is not fulfilled', () => {
	const o = order.plan(2)
	o.once(1)
	expect(() => o.end()).toThrow(InvalidOrder)
})
```

The message for that case is `Planned for 2 step but expecting step 2 when 'end()' is called`.

## Related

- [Types](/repobuddy/test/api/types/): `AssertOrder` methods, `InvalidOrder`, `OrderApi`, `ExpectWithOrder`.
- [Use `expect.order` with Jest](/repobuddy/test/guides/expect-order-with-jest/)
- [`@repobuddy/vitest`](/repobuddy/vitest/): ships `@repobuddy/vitest/setup/order`.
