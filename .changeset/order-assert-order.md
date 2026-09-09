---
'@repobuddy/test': minor
'@repobuddy/vitest': minor
---

Add `expect.order`, an [`AssertOrder`](https://github.com/cyberuni/assertron) factory for asserting code executes in the expected order.

`@repobuddy/test` exports `order`, `installOrder()`, and the `ExpectWithOrder` type. `installOrder(expect)` adds `order` to any test runner's `expect`, so `expect.order.plan(x)` creates an `AssertOrder` planned for `x` steps.

`@repobuddy/vitest` adds a `@repobuddy/vitest/setup/order` entry that installs it and augments `vitest`'s `ExpectStatic`, so the only wiring needed is adding it to `setupFiles`.
