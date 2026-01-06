# @repobuddy/biome

## 2.3.0

### Minor Changes

- e84465d: Enable `organizeImports`.
  It is stable enough to be enabled by default now.

### Patch Changes

- e84465d: Enable `noVar` warning by default.

## 2.2.0

### Minor Changes

- 4ef67eb: Update `biome` to `2.3.8`.
  Add default include pattern.

## 2.1.0

### Minor Changes

- a3251dc: Expand `noConsole` allow list to include additional console methods.

  The `noConsole` rule now allows more console methods including `clear`, `count`, `countReset`, `debug`, `dir`, `dirxml`, `group`, `groupCollapsed`, `groupEnd`, `time`, `timeEnd`, `timeLog`, `trace`, `profile`, `profileEnd`, and `timeStamp`.

### Patch Changes

- c7178a0: Set peer of `@biomejs/biome` to `>= 2`.

## 2.0.1

### Patch Changes

- f371548: Fix `noUnusedVariables` to use default options value.

## 2.0.0

### Major Changes

- 09e67ba: Update to support `biome` v2.

## 1.7.1

### Patch Changes

- ef06b2b: Adding json override back to handle some extra files.

## 1.7.0

### Minor Changes

- 10416f0: Enable `noConsoleLog` rule.

## 1.6.0

### Minor Changes

- 981a147: Remove the `json` and `jsonc` config as `biome` `1.8` has sufficient support for them.
- dbbc5ba: Update biome to 1.8.3 (peer dependency: >= 1.8.0).
  Add `trailingCommas` config.

  Add `**/*.jsonc` to override.
  `biome` is not just using the `jsonc` config to parse JSON files,
  it is actually using the `jsonc` parser to parse JSON files.
  See https://github.com/biomejs/biome-vscode/issues/285 for more details.

  And since `override` is replaced instead of merged,
  if you have your own `override`,
  you need to add an override for `jsonc` files.

  See https://github.com/repobuddy/repobuddy/blob/main/packages/biome/recommended.jsonc#L63 for the recommended override.

## 1.5.1

### Patch Changes

- c77fa32: Use `jsonc` and provide some reasoning about the rule choices.

## 1.5.0

### Minor Changes

- 60f3b39: Turn off `useTemplate`.

  It's a style preference that works in some cases,
  but will negatively impact performance.

## 1.4.0

### Minor Changes

- a54ae1c: Remove `trailingComma: none` recommendation.

  Following "least friction" rule,
  using the default `trailingComma: all` is better than `trailingComma: none`.
  It is easier to edit and cleaner git history.

## 1.3.0

### Minor Changes

- 352d379: Add `performant` config

## 1.2.1

### Patch Changes

- Override settings for `package.json` to make sure it expands arrays into multiple lines.

  Tools like `changesets` and `semantic-release` keeps that format.
  This change prevents unnecessary changes to the `package.json` file.

## 1.2.0

### Minor Changes

- 411e772: Set `.swcrc` to support `jsonc`.
- 0a1a0db: Use tab by default for all files.
  Accessibility on Markdown also matters.

## 1.1.0

### Minor Changes

- 68c8a72: Add `performant.json`.
  It is for low-level library author to write performant code.

### Patch Changes

- 1eb8d02: Fix `.vscode/*` linting.

## 1.0.4

### Patch Changes

- 470d8c3: Change `noForEach` from `error` to `off`.

## 1.0.3

### Patch Changes

- b6560a8: Set line ending and width for all files.
  Turn off `useLiteralKeys` as it conflicts with TS.

## 1.0.2

### Patch Changes

- bc53e3c: Turnoff `noExplicitAny`.

  That's for beginner.

## 1.0.1

### Patch Changes

- 83eef63: Turn off `noAssignInExpressions`.

  Your tests should cover behavior issue,
  do not need to enforce such linting in code.

## 1.0.0

### Major Changes

- cbf220a: init release
