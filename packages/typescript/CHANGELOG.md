# @repobuddy/typescript

## 2.1.2

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

## 2.1.1

### Patch Changes

- 4e55a09: Rename the `ts` source folder to `src`.

  The published source folder is now `src` instead of `ts`. The public API and all
  export specifiers are unchanged; only the shipped file paths differ (relevant to
  JSR consumers, which resolve `./src/...` instead of `./ts/...`).

## 2.1.0

### Minor Changes

- 030b32d: Update `clibuilder` to 9.0
- 0905670: Add `copy-cjs-package-json` (alias: `cpj`) command.

## 2.0.0

### Major Changes

- b1cdec8: Disable `cjs` with `node16` to support TS 5.2.

## 1.3.0

### Minor Changes

- bac4ed4: Infer `moduleResolution` when possible.

  `module: Node16` infers `moduleResolution: Node16`.
  Relying on infer [fixes an issue with `ts-jest`](https://github.com/kulshekhar/ts-jest/issues/4198#issuecomment-1863407516).

## 1.2.1

### Patch Changes

- c2a433e: accepts esm and skip copy package json

## 1.2.0

### Minor Changes

- bff87cb: Add legacy monorepo.json for TypeScript version older than 5.0

## 1.1.2

### Patch Changes

- f09b913: Support extends tsconfig without `.json`.

## 1.1.1

### Patch Changes

- 75de779: Update clibuilder
- 75de779: fix copy package.cjs.json code
- 81dc7e2: Update `clibuilder`

## 1.1.0

### Minor Changes

- 68dc49e: Add cli command `ts build cjs|tslib`.

  Fix exports fields for the tsconfigs.

## 1.0.0

### Major Changes

- f307f89: Initial release.

  It provides `@repobuddy/typescript/tsconfig/monorepo` for monorepo projects.

  Other features will be added in the future.
