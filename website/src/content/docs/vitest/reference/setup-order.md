---
title: '@repobuddy/vitest/setup/order'
description: A Vitest setup file that adds expect.order for asserting that code runs in a given order.
---

`@repobuddy/vitest/setup/order` is a setup file that adds `expect.order` to Vitest's `expect` and types it.

## Usage

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import { nodeTestPreset } from '@repobuddy/vitest/config/node'

export default defineConfig({
	plugins: [nodeTestPreset()],
	test: { setupFiles: ['@repobuddy/vitest/setup/order'] },
})
```

The file exports nothing. It calls `installOrder(expect)` from `@repobuddy/test` and augments `vitest`'s
`ExpectStatic` with `ExpectWithOrder`, so `expect.order` is typed in your tests with no extra imports.

## Options

None.

## What it adds

| Member | Returns | Effect |
| --- | --- | --- |
| `expect.order.plan(steps?)` | `AssertOrder` | Creates an `AssertOrder` that expects `steps` steps. Omit `steps` for an unplanned one. |

`AssertOrder` comes from [assertron](https://github.com/cyberuni/assertron). The methods below are the ones this
package tests:

| Method | Effect |
| --- | --- |
| `once(step)` | Asserts that `step` is reached now, once. Throws `InvalidOrder` when it runs out of order. |
| `end()` | Throws `InvalidOrder` when the planned steps were not all reached. |

`InvalidOrder` is exported from `@repobuddy/vitest` and `@repobuddy/test`.

## Behavior

- It works in Node.js projects and in `browserTestPreset()` projects.
- Vite concatenates your `test.setupFiles` with the one `browserTestPreset()` adds. Neither replaces the other.

## Examples

```ts
it('calls the callbacks in order', () => {
	const o = expect.order.plan(2)

	subject.on('start', () => o.once(1))
	subject.on('end', () => o.once(2))

	subject.run()

	o.end()
})
```

Check that a step out of order throws:

```ts
import { InvalidOrder } from '@repobuddy/vitest'

it('throws when the code runs out of order', () => {
	const o = expect.order.plan(2)
	o.once(1)
	expect(() => o.once(1)).toThrow(InvalidOrder)
})
```

## Related

- [Assert call order](/repobuddy/vitest/guides/expect-order/)
- [`@repobuddy/test`](/repobuddy/test/): `order` and `installOrder()` for any test runner
