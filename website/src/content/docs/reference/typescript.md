---
title: '@repobuddy/typescript'
description: Composable tsconfig presets, grouped by TSConfig category, plus a buddy CLI plugin for CommonJS builds.
---

`@repobuddy/typescript` ships `tsconfig` presets you extend, and a plugin that adds `ts` commands to the
[`buddy` CLI](/repobuddy/reference/repobuddy/).

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

The package is ESM only. It does not declare TypeScript as a peer dependency, so install the version your project
needs.

## Presets

Extend a preset by its path. The `.json` extension is optional.

```jsonc
// tsconfig.json
{
	"extends": "@repobuddy/typescript/tsconfig/monorepo",
	"compilerOptions": {
		"outDir": "esm"
	}
}
```

| Preset | For |
| --- | --- |
| `tsconfig/monorepo` | A package in a monorepo. Composes the `buddy.json` of the emit, interop, language, modules, and type-checking categories, plus `projects/composite`. |
| `tsconfig/legacy/monorepo` | The same settings inlined in one file, for TypeScript older than 5.0 and for tools that cannot follow an `extends` array (such as Astro's `tsconfig-resolver`). |

## Building blocks

Each folder under `tsconfig/` matches a category of the [TSConfig reference](https://www.typescriptlang.org/tsconfig).
Each file sets a few options for one purpose. Compose them with an `extends` array:

```jsonc
// tsconfig.json
{
	"extends": [
		"@repobuddy/typescript/tsconfig/modules/nodenext",
		"@repobuddy/typescript/tsconfig/type-checking/buddy-strictest",
		"@repobuddy/typescript/tsconfig/emit/buddy"
	]
}
```

`buddy.json` in a category is the recommended choice for that category.

| File | Sets |
| --- | --- |
| `diagnostics/buddy` | `extendedDiagnostics`, `listEmittedFiles`, `listFiles`, `traceResolution` |
| `emit/buddy` | Extends `emit/declaration`, `emit/sourcemap`, and `emit/line-endings` |
| `emit/declaration` | `declaration`, `declarationMap` |
| `emit/sourcemap` | `sourceMap` |
| `emit/line-endings` | `newLine: "lf"` |
| `interop/buddy` | `forceConsistentCasingInFileNames`, `isolatedModules` |
| `interop/esm` | `esModuleInterop`. Use with ES and CommonJS modules, not with Node16 or NodeNext. |
| `javascript/buddy` | `allowJs`, `checkJs` |
| `language/buddy` | `target: "ES2020"`, `useDefineForClassFields` |
| `language/metadata` | `emitDecoratorMetadata` |
| `language/react` | `jsx: "react-jsx"` |
| `modules/buddy` | `module: "Node16"`, `resolveJsonModule` |
| `modules/buddy-commonjs` | `module: "CommonJS"`, `esModuleInterop`, `resolveJsonModule`, `verbatimModuleSyntax: false` |
| `modules/node16` | `module: "Node16"` |
| `modules/nodenext` | `module: "NodeNext"` |
| `modules/commonjs` | `module: "CommonJS"` |
| `modules/commonjs-legacy` | `module: "CommonJS"`, `moduleResolution: "Node16"` (TypeScript older than 5.2) |
| `modules/es2020` | `module: "ES2020"`, `moduleResolution: "Bundler"` |
| `modules/es2020-legacy` | `module: "ES2020"`, `moduleResolution: "Node"` |
| `modules/es2022` | `module: "ES2022"`, `moduleResolution: "Bundler"` |
| `modules/ui-assets` | `allowArbitraryExtensions`, `resolveJsonModule` |
| `projects/composite` | `composite` |
| `projects/large-project` | `composite`, `disableReferencedProjectLoad` |
| `type-checking/recommended` | `strict`, `exactOptionalPropertyTypes` |
| `type-checking/buddy` | `recommended` plus `noPropertyAccessFromIndexSignature`, `noUncheckedIndexedAccess`, `noUnusedLocals`, `noUnusedParameters` |
| `type-checking/buddy-strictest` | `buddy` plus `noFallthroughCasesInSwitch`, `noImplicitOverride`, `noImplicitReturns` |

`modules/buddy` leaves `verbatimModuleSyntax` off. With it on, `ts-jest` reports
`TS1286: ESM syntax is not allowed in a CommonJS module` for ESM projects.

## CommonJS package.json

`@repobuddy/typescript/nodejs/package.cjs.json` contains `{ "type": "commonjs" }`. Copy it into a CommonJS build's
output folder so Node.js reads the `.js` files there as CommonJS inside a `"type": "module"` package.

## buddy CLI plugin

The package is a plugin for the `repobuddy` CLI. Install both, then list the plugin in the CLI's config so its
commands load:

```json
// .repobuddy.json
{
	"plugins": ["@repobuddy/typescript"]
}
```

| Command | What it does |
| --- | --- |
| `buddy ts build <cjs\|esm\|tslib>` | Runs `tsc -p tsconfig.<type>.json`. For `cjs` and `tslib` it then copies `package.cjs.json` to `<type>/package.json`. |
| `buddy ts copy-cjs-package-json <dir> [cwd]` | Copies `package.cjs.json` to `<dir>/package.json`. `cwd` defaults to the current directory. Alias: `cpj`. |

The commands are in beta.

## Related

- [`repobuddy`](/repobuddy/reference/repobuddy/): the CLI that loads this plugin.
- [Packages overview](/repobuddy/reference/packages/): every package in the repository.
