---
title: '@repobuddy/test'
description: Runner-agnostic test utilities, expect.order for asserting execution order and isRunningInTest.
---

`@repobuddy/test` holds test utilities that do not depend on one test runner. Most projects get it through
[`@repobuddy/vitest`](/repobuddy/vitest/), which re-exports it. Install it directly to use it with Jest or another
runner.

## Install

```sh
# npm
npm install -D @repobuddy/test

# yarn
yarn add -D @repobuddy/test

# pnpm
pnpm add -D @repobuddy/test
```

## Choose an export

| You want to | Use |
| --- | --- |
| Assert that callbacks run in a planned order | [`installOrder(expect)`](/repobuddy/test/api/install-order/), then `expect.order.plan(n)` |
| Create an order assertion without touching `expect` | [`order.plan(n)`](/repobuddy/test/api/install-order/#order) |
| Type `expect.order` for your runner | [`ExpectWithOrder`](/repobuddy/test/api/types/#expectwithorder) |
| Catch an order failure by class | [`InvalidOrder`](/repobuddy/test/api/types/#invalidorder) |
| Tell a test run from a real browser session | [`isRunningInTest()`](/repobuddy/test/api/is-running-in-test/) |

## Guides

- [Use `expect.order` with Jest](/repobuddy/test/guides/expect-order-with-jest/)

With Vitest, use the `@repobuddy/vitest/setup/order` setup file from [`@repobuddy/vitest`](/repobuddy/vitest/). It
calls `installOrder` and adds the types.

## Support

| Area | Support |
| --- | --- |
| Test runners | Any runner whose `expect` is an object. `installOrder` only defines a property on it. Covered by tests: Vitest. Checked by hand: Jest 30 in ESM mode. |
| Peer dependencies | None. The one dependency is `assertron` (`^11.7.0`). |
| Node.js | No `engines` field. |
| Module format | ESM only. The `.` export has an `import` condition and no `require` condition. |
| Environments for `isRunningInTest()` | Covered by tests: Node.js and Vitest browser mode (Chromium). The code also checks for an Edge runtime global and for `jsdom`, `HappyDOM`, `StorybookTestRunner`, or `HeadlessChrome` in the user agent. See [the rules](/repobuddy/test/api/is-running-in-test/#behavior). |
| TypeScript | Ships `.d.ts` files. The `exports` map also has a `source` condition that points at `src/index.ts`. |

### Not supported

- No CommonJS entry. `require('@repobuddy/test')` fails, so Jest must run test files as ESM to import it.
- No automatic `expect` type augmentation. Only `@repobuddy/vitest/setup/order` augments types, and only for Vitest.
- No setup file for Jest or other runners. Call `installOrder` from your own setup file.
- `isRunningInTest()` does not detect test runs that execute in a regular, non-headless browser.

## Reference

- [API](/repobuddy/test/api/)
