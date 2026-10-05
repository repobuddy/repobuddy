---
title: tsconfig presets
description: Every tsconfig file that @repobuddy/typescript ships, grouped into presets and category building blocks.
---

Extend a file by its package path. The `.json` extension is optional, because the package exports both
`./tsconfig/*.json` and `./tsconfig/*`.

```jsonc
// tsconfig.json
{
	"extends": "@repobuddy/typescript/tsconfig/monorepo",
	"compilerOptions": {
		"outDir": "esm"
	}
}
```

## Presets

A preset sets everything a project needs in one file.

| Preset | Purpose |
| --- | --- |
| [`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/) | A package in a monorepo. Composes six building blocks with an `extends` array. |
| [`tsconfig/legacy/monorepo`](/repobuddy/typescript/tsconfig/legacy-monorepo/) | The same options inlined in one file, for TypeScript older than 5.0 and for tools that cannot follow an `extends` array. |

## Building blocks

Each folder under `tsconfig/` matches a category of the [TSConfig reference](https://www.typescriptlang.org/tsconfig).
Each file sets a few options for one purpose. `buddy.json` in a category is the recommended file for that category.
Compose them with an `extends` array (see [Compose your own tsconfig](/repobuddy/typescript/guides/compose-tsconfig/)).

| Category page | Files |
| --- | --- |
| [Diagnostics](/repobuddy/typescript/tsconfig/diagnostics/) | `diagnostics/buddy` |
| [Emit](/repobuddy/typescript/tsconfig/emit/) | `emit/buddy`, `emit/declaration`, `emit/sourcemap`, `emit/line-endings` |
| [Interop](/repobuddy/typescript/tsconfig/interop/) | `interop/buddy`, `interop/esm` |
| [JavaScript](/repobuddy/typescript/tsconfig/javascript/) | `javascript/buddy` |
| [Language](/repobuddy/typescript/tsconfig/language/) | `language/buddy`, `language/metadata`, `language/react` |
| [Modules](/repobuddy/typescript/tsconfig/modules/) | `modules/buddy`, `modules/buddy-commonjs`, `modules/node16`, `modules/nodenext`, `modules/commonjs`, `modules/commonjs-legacy`, `modules/es2020`, `modules/es2020-legacy`, `modules/es2022`, `modules/ui-assets` |
| [Projects](/repobuddy/typescript/tsconfig/projects/) | `projects/composite`, `projects/large-project` |
| [Type checking](/repobuddy/typescript/tsconfig/type-checking/) | `type-checking/recommended`, `type-checking/buddy`, `type-checking/buddy-strictest` |

## Known failures

Each file was extended on its own and compiled with TypeScript 6.0.3 and 7.0.2. Three files report an error:

| File | TypeScript 6.0.3 | TypeScript 7.0.2 |
| --- | --- | --- |
| `language/metadata` | `TS5052`: needs `experimentalDecorators` | Same |
| `modules/commonjs-legacy` | `TS5110`: `module` must be `Node16` when `moduleResolution` is `Node16` | Same |
| `modules/es2020-legacy` | `TS5107`: `moduleResolution=node10` is deprecated | `TS5108`: `moduleResolution=node10` has been removed |

`language/metadata` works once your config also sets `experimentalDecorators: true`. The two legacy module files are
for TypeScript versions older than these.
