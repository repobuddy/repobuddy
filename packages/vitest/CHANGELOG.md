# @repobuddy/vitest

## 2.1.4

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
- Updated dependencies [5789ca2]
  - @repobuddy/test@1.0.2

## 2.1.3

### Patch Changes

- 8047432: Annotate `browserTestPreset()` and `nodeTestPreset()` return types as vite's `Plugin`.
  
  The return types were inferred structurally, so the emitted `.d.ts` leaked the whole config shape.
  `test.browser.instances[].browser` is typed against vitest's augmentable `_BrowserNames` interface,
  which resolved to `string` when the presets were built without a browser provider installed. In a
  consumer project `@vitest/browser-playwright` augments `_BrowserNames`, `browser` narrows to the
  provider's union, and `string` is no longer assignable — `browserTestPreset()` failed with TS2769
  "No overload matches this call".
  
  Annotating the return type keeps the emitted types independent of what is installed at build time.
  Runtime behavior is unchanged.
  
  Fixes https://github.com/repobuddy/repobuddy/issues/610

## 2.1.2

### Patch Changes

- Updated dependencies [fb1b12d]
  - @repobuddy/test@1.0.1

## 2.1.1

### Patch Changes

- fc759e3: Update vitest and @vitest/browser-playwright to 4.0.15.

## 2.1.0

### Minor Changes

- 61b37f3: Add `@repobuddy/vitest/config/node` and `@repobuddy/vitest/config/browser` exports.
  `@repobuddy/vitest/config` exports requires `@vitest/browser-playwright` as peer dependency even if you are not using browser tests.

### Patch Changes

- b6d5693: Remove unnecessary type casting in `browserTestPreset`.

## 2.0.0

### Major Changes

- dab777e: Upgrade to support Vitest 4.

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
