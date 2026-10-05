---
title: interop
description: The tsconfig building blocks for interop constraints between files and module systems.
---

Files under `@repobuddy/typescript/tsconfig/interop/` match the
[Interop Constraints](https://www.typescriptlang.org/tsconfig#Interop_Constraints_6252) category of the TSConfig
reference.

| File | Sets |
| --- | --- |
| [`interop/buddy`](#interopbuddy) | `forceConsistentCasingInFileNames`, `isolatedModules` |
| [`interop/esm`](#interopesm) | `esModuleInterop` |

## `interop/buddy`

The recommended interop settings. Used by [`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/).

```json
{
	"compilerOptions": {
		"forceConsistentCasingInFileNames": true,
		"isolatedModules": true
	}
}
```

- `forceConsistentCasingInFileNames` rejects an import whose casing differs from the file name on disk.
- `isolatedModules` reports code that a single-file transpiler (esbuild, SWC, Babel) cannot compile.
- `tsc --showConfig` (TypeScript 7.0.2) also lists `preserveConstEnums: true`, which TypeScript derives from
  `isolatedModules`.

## `interop/esm`

```json
{
	"compilerOptions": {
		"esModuleInterop": true
	}
}
```

Use it with `module` set to an `ES*` value or `CommonJS`. Do not use it with `Node16` or `NodeNext` (the file's own
comment says so).

[`modules/buddy-commonjs`](/repobuddy/typescript/tsconfig/modules/#modulesbuddy-commonjs) already sets
`esModuleInterop`, so you do not need this file with it.

## Related

- [tsconfig presets](/repobuddy/typescript/tsconfig/)
- [Modules](/repobuddy/typescript/tsconfig/modules/)
