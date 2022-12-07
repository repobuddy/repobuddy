# @unional/jest-presets

## 1.4.0

### Minor Changes

- 35078f8: add `@repobuddy/jest/resolver`

## 1.3.1

### Patch Changes

- 106cdb3: fix ts-cjs syntax to CJS
- 3c0f19b: Exports presets directly in `@repobuddy/jest`.
  This make it easier to customize the behavior.

## 1.3.0

### Minor Changes

- e290da4: `configSourceDir()` will auto detect source folder,
  using `src > source > ts > js` and default to `src` if not found.
- eeb99b7: add `configSourceDir()`.
  add `configNodejs()` as alias of `createNodejsConfig()`.

### Patch Changes

- 71b8e4a: use `import type`

## 1.2.0

### Minor Changes

- 52b3a0b: add `withTransformEsmPackages()`.

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
