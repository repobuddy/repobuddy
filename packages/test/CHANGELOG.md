# @repobuddy/test

## 1.1.0

### Minor Changes

- 628f3a8: Add `expect.order`, an [`AssertOrder`](https://github.com/cyberuni/assertron) factory for asserting code executes in the expected order.
  
  `@repobuddy/test` exports `order`, `installOrder()`, and the `ExpectWithOrder` type. `installOrder(expect)` adds `order` to any test runner's `expect`, so `expect.order.plan(x)` creates an `AssertOrder` planned for `x` steps.
  
  `@repobuddy/vitest` adds a `@repobuddy/vitest/setup/order` entry that installs it and augments `vitest`'s `ExpectStatic`, so the only wiring needed is adding it to `setupFiles`.

## 1.0.2

### Patch Changes

- 5789ca2: Build with TypeScript 7.
  
  The emitted output changes cosmetically: TypeScript 7 preserves the source
  quote style in re-export specifiers (`export * from './x.js'` rather than
  `"./x.js"`), and the property order inside one inferred `.d.ts` union in
  `@repobuddy/typescript` differs. No public API, type or runtime behavior
  changes.
  
  The `tsconfig` presets themselves are unchanged and remain valid under both
  TypeScript 6 and 7 — they use no option TypeScript 7 removed, and
  `@repobuddy/typescript` now type-checks and builds against 7.0.2 using them.

## 1.0.1

### Patch Changes

- fb1b12d: Fix `isRunningInVitest()` to also detect the `__vitest_worker__` global, ensuring vitest is correctly identified in non-browser (node/worker) environments.

## 1.0.0

### Major Changes

- 6be6902: Initial release of `@repobuddy/test`.
  Downstream `isRunningInTest` from `@repobuddy/vitest`.
