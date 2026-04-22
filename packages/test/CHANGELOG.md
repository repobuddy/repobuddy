# @repobuddy/test

## 1.0.1

### Patch Changes

- fb1b12d: Fix `isRunningInVitest()` to also detect the `__vitest_worker__` global, ensuring vitest is correctly identified in non-browser (node/worker) environments.

## 1.0.0

### Major Changes

- 6be6902: Initial release of `@repobuddy/test`.
  Downstream `isRunningInTest` from `@repobuddy/vitest`.
