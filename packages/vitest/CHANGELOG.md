# @repobuddy/vitest

## 1.2.2

### Patch Changes

- 0ba4eba: Move `headless` up under `browser`

  Related to https://discord.com/channels/917386801235247114/1368386214335352922/1368386214335352922

## 1.2.1

### Patch Changes

- 6be6902: Downstream `isRunningInTest` to `@repobuddy/test`.

  Remove merge config in node preset.
  Vitest does it automatically.

- Updated dependencies [6be6902]
  - @repobuddy/test@1.0.0

## 1.2.0

### Minor Changes

- a48f4c6: Add `isRunningInTest`.

## 1.1.0

### Minor Changes

- 99621a3: Use `@repobuddy/vitest/setup/browser` to set the timezone to GMT.
  Auto `restoreAllMocks` after all tests.

## 1.0.0

### Major Changes

- 1e72cc3: Initial release of `@repobuddy/vitest`.
  Adds presets for running tests in Node.js and browser environments.

  ## Features

  - Presets for running tests in Node.js and browser environments.
  - Support for TypeScript, JavaScript, and TypeScript React.
  - Support for Vitest v3.
