---
title: tsconfig/legacy/monorepo
description: The monorepo preset with every option inlined in one file, for tools that cannot follow an extends array.
---

`tsconfig/legacy/monorepo` sets the same options as [`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/),
written out in one file instead of an `extends` array.

## Usage

```jsonc
// tsconfig.json
{
	"extends": "@repobuddy/typescript/tsconfig/legacy/monorepo",
	"compilerOptions": {
		"outDir": "esm",
		"rootDir": "src"
	}
}
```

Use it when:

- Your TypeScript version is older than 5.0, which added `extends` arrays.
- A tool reads your tsconfig and cannot follow an `extends` array. The package readme names Astro's
  `tsconfig-resolver` ([withastro/astro#6918](https://github.com/withastro/astro/issues/6918)).

## Options

None.

## Source

```json
{
	"compilerOptions": {
		"composite": true,
		"declaration": true,
		"declarationMap": true,
		"exactOptionalPropertyTypes": true,
		"forceConsistentCasingInFileNames": true,
		"isolatedModules": true,
		"module": "Node16",
		"newLine": "lf",
		"noPropertyAccessFromIndexSignature": true,
		"noUncheckedIndexedAccess": true,
		"noUnusedLocals": true,
		"noUnusedParameters": true,
		"resolveJsonModule": true,
		"sourceMap": true,
		"strict": true,
		"target": "ES2020",
		"useDefineForClassFields": true
	}
}
```

## Effective config

`tsc --showConfig` (TypeScript 7.0.2) prints the same `compilerOptions` for this file as for
[`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/#effective-config), including the four derived options
`moduleResolution: node16`, `moduleDetection: force`, `preserveConstEnums`, and `incremental`.

## Behavior

- The two presets are kept in sync by hand. Nothing in the package checks that they match.
- `module: Node16` needs TypeScript 4.7 or later.

## Related

- [`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/)
- [tsconfig presets](/repobuddy/typescript/tsconfig/)
