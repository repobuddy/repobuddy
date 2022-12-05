# @unional/jest-presets

## 1.1.0

### Minor Changes

- 6f92dcd: Add `withChalk` and `toSatisfies`.

  Testing localling need some work.
  And `withChalk` should be generialized to `withEsmModule(moduleName)`

- 8538578: Add dual package support.
  It may not need this but maybe `jest` can run in `CJS` or `ESM` mode in the future.
  Having both to make sure it will continue to work.

  add `createNodejsConfig()` to customize behavior.

## 1.0.0

### Major Changes

- 0c0a303: Initial release
