# @repobuddy/typescript

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
