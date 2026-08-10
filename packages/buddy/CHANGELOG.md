# repobuddy

## 1.3.2

### Patch Changes

- 4e55a09: Rename the `ts` source folder to `src`.

  The published source folder is now `src` instead of `ts`. The public API and all
  export specifiers are unchanged; only the shipped file paths differ (relevant to
  JSR consumers, which resolve `./src/...` instead of `./ts/...`).

## 1.3.1

### Patch Changes

- 5bce37c: fix bin path

## 1.3.0

### Minor Changes

- bd113cc: Add `bd` as alias of `buddy`

## 1.2.0

### Minor Changes

- 030b32d: Update `clibuilder` to 9.0

## 1.1.0

### Minor Changes

- 3e394fb: Add `templates/.editorconfig`.
  Remove extra files in the distribution.

## 1.0.2

### Patch Changes

- 76dac3b: update readme

## 1.0.1

### Patch Changes

- 75de779: Update clibuilder
- 81dc7e2: Update `clibuilder`

## 1.0.0

### Major Changes

- 3835d89: Initial release.

  It is an plugin CLI.
  Commands will be added by other packages.
