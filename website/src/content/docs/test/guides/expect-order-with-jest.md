---
title: Use expect.order with Jest
description: Install expect.order in a Jest setup file and type it, with Jest running in ESM mode.
---

This guide adds `expect.order` to Jest. `@repobuddy/test` is ESM only, so Jest must load the setup file and tests as
ES modules.

Checked with Jest 30.4 on Node.js 24, using `.js` test files in a `"type": "module"` package.

## Steps

1. Install the package:

   ```sh
   pnpm add -D @repobuddy/test
   ```

2. Create `setup.js`. It installs `order` on the `expect` from `@jest/globals`:

   ```js
   import { expect } from '@jest/globals'
   import { installOrder } from '@repobuddy/test'

   installOrder(expect)
   ```

3. Register it in `jest.config.js` with `setupFilesAfterEnv`:

   ```js
   export default {
   	setupFilesAfterEnv: ['./setup.js'],
   	testEnvironment: 'node',
   	transform: {},
   }
   ```

4. Run Jest with ESM support turned on:

   ```sh
   NODE_OPTIONS=--experimental-vm-modules npx jest
   ```

   Without it, a CommonJS test that calls `require('@repobuddy/test')` fails with
   `Cannot find module '@repobuddy/test'`.

5. Write a test:

   ```js
   import { expect, it } from '@jest/globals'
   import { InvalidOrder } from '@repobuddy/test'

   it('passes when steps run in order', () => {
   	const o = expect.order.plan(2)
   	o.once(1)
   	o.once(2)
   	o.end()
   })

   it('throws InvalidOrder when a planned step is missing', () => {
   	const o = expect.order.plan(2)
   	o.once(1)
   	expect(() => o.end()).toThrow(InvalidOrder)
   })
   ```

   The global `expect` is the same object, so `expect.order` also works without importing `@jest/globals`.

6. For TypeScript test files, add a declaration file (for example `types/jest-order.d.ts`) that extends the type of the
   `expect` you use.

   With `expect` imported from `@jest/globals`:

   ```ts
   import type { ExpectWithOrder } from '@repobuddy/test'

   declare module 'expect' {
   	interface BaseExpect extends ExpectWithOrder {}
   }
   ```

   With the global `expect` from `@types/jest`:

   ```ts
   import type { ExpectWithOrder } from '@repobuddy/test'

   declare global {
   	namespace jest {
   		interface Expect extends ExpectWithOrder {}
   	}
   }
   ```

   `declare module 'expect'` needs the `expect` package to be resolvable from your project. If TypeScript reports
   `TS2664: Invalid module name in augmentation`, add `expect` to your dev dependencies.

   Do not augment `@jest/expect`: its `expect` type is a type alias, so the augmentation has no effect and
   `expect.order` still reports `TS2339`.

   For a TypeScript transform in Jest, see [`@repobuddy/jest`](/repobuddy/jest/).

## Finished files

```js
// jest.config.js
export default {
	setupFilesAfterEnv: ['./setup.js'],
	testEnvironment: 'node',
	transform: {},
}
```

```js
// setup.js
import { expect } from '@jest/globals'
import { installOrder } from '@repobuddy/test'

installOrder(expect)
```

## Verify

Run `NODE_OPTIONS=--experimental-vm-modules npx jest`. Both tests from step 5 pass:

```
Tests:       2 passed, 2 total
```

## Related

- [`installOrder()`](/repobuddy/test/api/install-order/)
- [Types](/repobuddy/test/api/types/)
