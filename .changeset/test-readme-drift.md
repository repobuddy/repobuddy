---
"@repobuddy/test": patch
---

The readme and the `installOrder()` doc comment now show a Jest type augmentation for `expect.order` that type-checks (`declare module 'expect' { interface BaseExpect ... }`, or the `jest` namespace for the global `expect`). The documented `declare module '@jest/expect'` form never worked: its `expect` is a type alias. The readme's npm badges also point at `@repobuddy/test` now.
