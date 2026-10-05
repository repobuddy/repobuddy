---
title: '@repobuddy/typescript'
description: Composable tsconfig presets grouped by TSConfig category, plus a buddy CLI plugin for CommonJS builds.
---

`@repobuddy/typescript` ships `tsconfig` presets that you extend, and a plugin that adds `ts` commands to the
[`buddy` CLI](/repobuddy/cli/).

## Install

```sh
# npm
npm install -D @repobuddy/typescript

# yarn
yarn add -D @repobuddy/typescript

# pnpm
pnpm add -D @repobuddy/typescript

# rush
rush add -p --dev @repobuddy/typescript
```

The package does not declare TypeScript as a peer dependency. Install the TypeScript version your project needs.

## Choose an entry

| You want to | Use |
| --- | --- |
| Configure a package in a monorepo with one line | [`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/) |
| The same settings, without an `extends` array | [`tsconfig/legacy/monorepo`](/repobuddy/typescript/tsconfig/legacy-monorepo/) |
| Pick settings one category at a time | [Building blocks](/repobuddy/typescript/tsconfig/) |
| Mark a build output folder as CommonJS | [`nodejs/package.cjs.json`](/repobuddy/typescript/nodejs-package-cjs-json/) |
| Run `tsc` for a CommonJS build and add that marker | [`buddy ts build`](/repobuddy/typescript/cli/build/) |
| Add the marker after your own build step | [`buddy ts copy-cjs-package-json`](/repobuddy/typescript/cli/copy-cjs-package-json/) |

## Guides

- [Configure a monorepo package](/repobuddy/typescript/guides/monorepo/)
- [Compose your own tsconfig](/repobuddy/typescript/guides/compose-tsconfig/)
- [Build CommonJS and ESM from one package](/repobuddy/typescript/guides/dual-cjs-esm-build/)

## Support

| Area | Support |
| --- | --- |
| TypeScript | No peer range is declared. The repository builds the package with TypeScript 7 (`devDependencies`: `typescript ^7.0.0`). |
| `extends` arrays | [`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/) and `emit/buddy` use an `extends` array, which TypeScript 5.0 added. [`tsconfig/legacy/monorepo`](/repobuddy/typescript/tsconfig/legacy-monorepo/) inlines the same options for older versions and for tools that cannot follow an array. |
| Legacy module files | `modules/commonjs-legacy` and `modules/es2020-legacy` are for older TypeScript. Both fail on TypeScript 6 and 7. See [Modules](/repobuddy/typescript/tsconfig/modules/). |
| Module format | The JavaScript entry (the CLI plugin) is ESM only: the `.` export has an `import` condition and no `require` condition. The tsconfig and `nodejs/*` files are plain JSON. |
| CLI host | The `ts` commands run inside the `buddy` CLI from the [`repobuddy`](/repobuddy/repobuddy/) package. |
| Monorepo and single package | The presets work for either. `tsconfig/monorepo` turns on `composite` for project references. |

Checked against TypeScript 6.0.3 and 7.0.2: every tsconfig file compiles except the three listed under
[Known failures](/repobuddy/typescript/tsconfig/#known-failures).

### Not supported

- No `buddy ts init` or `buddy ts up` command. The plugin registers only `build` and `copy-cjs-package-json`.
- No CommonJS entry for the plugin. `require('@repobuddy/typescript')` fails.
- `buddy ts build` does not take a custom tsconfig path, extra `tsc` flags, or a watch mode. It always runs
  `tsc -p tsconfig.<type>.json`.
- `buddy ts build` does not print `tsc` output on success.
- No preset sets `lib`, `types`, `outDir`, or `rootDir`. Set them in your own `tsconfig.json`.

## Reference

- [tsconfig presets and building blocks](/repobuddy/typescript/tsconfig/)
- [`nodejs/package.cjs.json`](/repobuddy/typescript/nodejs-package-cjs-json/)
- [CLI plugin](/repobuddy/typescript/cli/)
