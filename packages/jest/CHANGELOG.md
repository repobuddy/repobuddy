# @unional/jest-presets

## 3.0.0

### Major Changes

- 27631e3: Bump to support [jest@29.4.0][jest].

  [jest@29.4.0][jest] now support subpath imports directly.
  The type of the resolver also changed,
  causing `TypeError: this._resolver.getGlboalPaths` when using `@repobuddy/jest`.

  The `resolver` is still exported if you need to use an older version of `jest`.
  In that case, you will need to specify `resolver` directly:

  ```js
  module.exports = {
    resolver: '@repobuddy/jest/resolver`
  }
  ```

  [jest]: https://github.com/facebook/jest/releases/tag/v29.4.0

## 2.3.1

### Patch Changes

- 2977fa2: Update `type-plus` to 5.0.0
- 4b6c696: Update `resolve.imports` to 1.2.7

## 2.3.0

### Minor Changes

- 6f3d193: Add `moduleNameMapper` field helpers

## 2.2.1

### Patch Changes

- 1071a3f: Fix `js-cjs` config to work with ESM packages.

  Needs the same `transformIgnorePatterns: []` so that the packages can be transformed.

  The tests in `js-cjs` was not executed because of missing `coverage` test.

## 2.2.0

### Minor Changes

- 1a5d8a1: Add `jsdom` presets.
  Add `knownTransforms.swc()`.

## 2.1.0

### Minor Changes

- 4a9e534: Add `ts` and `ts-watch` presets.

  These presets will auto detect if your project is CJS or ESM.

### Patch Changes

- 01b4ebc: fix `-watch` presets redirect

## 2.0.0

### Major Changes

- 4043b19: rename `configSourceDir()` to `configSource()`.
  It now accepts multiple `dir`
- 7308011: Add `definedWatchPlugins()`.
  Add `watchPlugins`.
  Remove `watch`

### Minor Changes

- a5fa056: Remove `withChalk()` no need anymore
- 397638d: Add `transform`
- b015ca9: add `testEnviornment`
- 3fb7682: Add `knownRunners`
- c188ac8: Rename `watchPlugins` to `knownWatchPlugins`
  Add `watchPlugins` as the default set of plugins.
- 08fd09f: Move watch to watch presets
- c8cc7af: Add `knownTransforms.esmPackages()`.

  `ts-cjs` and `js-cjs` uses it by default.

- e8cff70: Add `extensionsToTreatAsEsm`

### Patch Changes

- 3939136: Upgrade `resolve.imports` to 1.2.3
- d2163ad: Add `resolver.async` just for completeness
- a7c5845: Fix coverage for node specific tests.
- d760b91: fix `withTransformEsmPackages()`.
  It needs to set `transformIgnorePatterns` to `[]`.
- e963322: fix matchers typing

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
