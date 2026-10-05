---
title: isRunningInTest()
description: Returns whether the code runs under a test runner, to tell a browser test run from a real browser session.
---

`isRunningInTest()` returns `true` when the code looks like it runs under a test runner.

## Signature

```ts
function isRunningInTest(): boolean
```

## Parameters

None.

## Behavior

It returns `true` when the first of these checks passes, in this order:

1. `globalThis.window` is not set, as in Node.js.
2. `globalThis.EdgeRuntime` is set.
3. Vitest's `__vitest_browser__` or `__vitest_worker__` global is set.
4. `window.navigator.userAgent` contains `StorybookTestRunner`, `jsdom`, `HappyDOM`, or `HeadlessChrome`.

Otherwise it returns `false`.

Edge cases:

- Any context without `window` counts as a test. It returns `true` in every Node.js process, not only test runs.
- In a regular desktop browser, it returns `false` unless one of the globals above is set.
- In a headless Chrome session that is not a test, it returns `true`, because the user agent contains
  `HeadlessChrome`.

Use it in code that runs in a browser, such as a Storybook story, to tell a test run from a person viewing the page.

## Examples

Under Vitest, in Node.js and in Vitest browser mode (both covered by the package's tests):

```ts
import { isRunningInTest } from '@repobuddy/test'
import { expect, it } from 'vitest'

it('detects the code is running in test runner directly', () => {
	expect(isRunningInTest()).toBe(true)
})
```

Outside any test runner, in a plain Node.js script, it still returns `true`, because there is no `window`:

```js
// check.mjs, run with `node check.mjs`
import { isRunningInTest } from '@repobuddy/test'

console.log(isRunningInTest()) // true
```

With a `window` whose user agent is a regular Chrome string, and none of the globals set, it returns `false`.

## Related

- [API](/repobuddy/test/api/)
