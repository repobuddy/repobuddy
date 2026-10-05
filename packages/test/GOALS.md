## Goals

- Test utilities that work with any test runner: `expect.order` through `installOrder(expect)`, and
  `isRunningInTest()`.

## Non-goals

- Runner-specific wiring. Setup files and `expect` type augmentation belong to the runner's package, such as
  `@repobuddy/vitest/setup/order`.
- A CommonJS entry.
