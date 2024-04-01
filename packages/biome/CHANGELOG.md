# @repobuddy/biome

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
