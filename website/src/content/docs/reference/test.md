---
title: '@repobuddy/test'
description: Runner-agnostic test utilities, expect.order for asserting execution order and isRunningInTest.
---

`@repobuddy/test` holds test utilities that do not depend on one test runner. Most projects get it through
[`@repobuddy/vitest`](/repobuddy/reference/vitest/), which re-exports it. Install it directly to use it with Jest or
another runner.

## Install

```sh
# npm
npm install -D @repobuddy/test

# yarn
yarn add -D @repobuddy/test

# pnpm
pnpm add -D @repobuddy/test
```

The package is ESM only and has no peer dependencies.

## Exports

| Export | Kind | Purpose |
| --- | --- | --- |
| `installOrder(expect)` | function | Adds `expect.order` to a runner's `expect` |
| `order` | value | The `OrderApi` that `installOrder` attaches |
| `isRunningInTest()` | function | Whether the code runs under a test runner |
| `AssertOrder`, `InvalidOrder` | class | Re-exported from [`assertron`](https://github.com/cyberuni/assertron) |
| `OrderApi` | type | `{ plan(steps?: number): AssertOrder }` |
| `ExpectWithOrder` | type | `{ order: OrderApi }`, for augmenting a runner's `expect` type |

## `installOrder(expect)`

Defines `order` on the `expect` you pass and returns the same object. The property is not enumerable, so it does
not show up in `Object.keys(expect)`.

```ts
import { installOrder } from '@repobuddy/test'
import { expect, it } from 'vitest'

installOrder(expect)

it('calls the callbacks in order', () => {
	const o = expect.order.plan(2)

	subject.on('start', () => o.once(1))
	subject.on('end', () => o.once(2))

	subject.run()

	o.end() // throws InvalidOrder when the 2 planned steps were not all reached
})
```

`expect.order.plan(steps)` returns an `AssertOrder` that expects `steps` steps. `end()` throws `InvalidOrder` when the
plan was not met. Call `plan()` with no argument for an unplanned instance.

With Vitest, use the [`@repobuddy/vitest/setup/order`](/repobuddy/reference/vitest/#expectorder) setup file instead.
It calls `installOrder` and adds the types.

For another runner, augment its `expect` type yourself. For Jest:

```ts
import type { ExpectWithOrder } from '@repobuddy/test'

declare module '@jest/expect' {
	interface Expect extends ExpectWithOrder {}
}
```

## `isRunningInTest()`

Returns `true` when any of these hold:

- There is no `window`, as in Node.js.
- `globalThis.EdgeRuntime` is set.
- Vitest's browser or worker globals are set.
- `navigator.userAgent` contains `StorybookTestRunner`, `jsdom`, `HappyDOM`, or `HeadlessChrome`.

Because any context without `window` counts, it returns `true` for every Node.js process, not only test runs. Use it
to tell a browser test run from a real browser session, such as a Storybook story under the test runner.

## Related

- [`@repobuddy/vitest`](/repobuddy/reference/vitest/): re-exports this package and wires `expect.order` for Vitest.
- [Packages overview](/repobuddy/reference/packages/): every package in the repository.
