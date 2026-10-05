---
title: Assert call order
description: Add expect.order to Vitest and assert that callbacks run in the order you expect.
---

This guide adds `expect.order` to your tests with the
[`@repobuddy/vitest/setup/order`](/repobuddy/vitest/reference/setup-order/) setup file.

## Steps

1. Add the setup file to `test.setupFiles` in each config that needs it:

   ```ts
   import { defineConfig } from 'vitest/config'
   import { nodeTestPreset } from '@repobuddy/vitest/config/node'

   export default defineConfig({
   	plugins: [nodeTestPreset()],
   	test: { setupFiles: ['@repobuddy/vitest/setup/order'] },
   })
   ```

2. In a test, plan the number of steps with `expect.order.plan(n)`.

3. Call `o.once(step)` at each step, numbering from `1`.

4. Call `o.end()` after the code under test finishes. It throws `InvalidOrder` if a planned step was not reached.

`expect.order` is typed once the setup file is in the config. You do not import anything in the test.

## Finished test

```ts
it('calls the callbacks in order', () => {
	const o = expect.order.plan(2)

	subject.on('start', () => o.once(1))
	subject.on('end', () => o.once(2))

	subject.run()

	o.end()
})
```

## Verify

1. Run the test. It passes when `start` fires before `end`.
2. Swap the two step numbers and run it again. `once()` throws `InvalidOrder`.

## Related

- [`@repobuddy/vitest/setup/order`](/repobuddy/vitest/reference/setup-order/)
- [`@repobuddy/test`](/repobuddy/test/): use `installOrder()` with another test runner
