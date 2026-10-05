---
title: tsconfig/monorepo
description: The tsconfig preset for a package in a monorepo, composed from six building blocks.
---

`tsconfig/monorepo` configures a package in a monorepo: Node16 modules, ES2020 output, declarations, source maps,
strict type checking, and `composite` for project references.

## Usage

```jsonc
// tsconfig.json
{
	"extends": "@repobuddy/typescript/tsconfig/monorepo",
	"compilerOptions": {
		"outDir": "esm",
		"rootDir": "src"
	},
	"include": ["src"]
}
```

## Options

None. The preset takes no parameters. Override any option in your own `compilerOptions`.

## Source

```json
{
	"extends": [
		"./emit/buddy.json",
		"./interop/buddy.json",
		"./language/buddy.json",
		"./modules/buddy.json",
		"./projects/composite.json",
		"./type-checking/buddy.json"
	]
}
```

Each entry links to its category page: [`emit/buddy`](/repobuddy/typescript/tsconfig/emit/#emitbuddy),
[`interop/buddy`](/repobuddy/typescript/tsconfig/interop/#interopbuddy),
[`language/buddy`](/repobuddy/typescript/tsconfig/language/#languagebuddy),
[`modules/buddy`](/repobuddy/typescript/tsconfig/modules/#modulesbuddy),
[`projects/composite`](/repobuddy/typescript/tsconfig/projects/#projectscomposite), and
[`type-checking/buddy`](/repobuddy/typescript/tsconfig/type-checking/#type-checkingbuddy).

## Effective config

`tsc --showConfig` (TypeScript 7.0.2) for a `tsconfig.json` that only extends the preset:

```json
{
	"compilerOptions": {
		"composite": true,
		"declaration": true,
		"declarationMap": true,
		"exactOptionalPropertyTypes": true,
		"forceConsistentCasingInFileNames": true,
		"isolatedModules": true,
		"module": "node16",
		"newLine": "lf",
		"noPropertyAccessFromIndexSignature": true,
		"noUncheckedIndexedAccess": true,
		"noUnusedLocals": true,
		"noUnusedParameters": true,
		"resolveJsonModule": true,
		"strict": true,
		"sourceMap": true,
		"target": "es2020",
		"useDefineForClassFields": true,
		"moduleResolution": "node16",
		"moduleDetection": "force",
		"preserveConstEnums": true,
		"incremental": true
	}
}
```

The preset files set the first 17 options. TypeScript derives the last four:

- `moduleResolution: node16` and `moduleDetection: force` follow from `module: node16`.
- `incremental` follows from `composite`.
- `preserveConstEnums` follows from `isolatedModules`.

TypeScript 6.0.3 reports the same set of options.

## Behavior

- `verbatimModuleSyntax` stays off. With it on, `ts-jest` reports
  `TS1286: ESM syntax is not allowed in a CommonJS module` for ESM projects.
- `composite` requires every source file to be matched by `include` or `files`, and emits a `.tsbuildinfo` file.
- The preset uses an `extends` array, which needs TypeScript 5.0 or later. For older versions, use
  [`tsconfig/legacy/monorepo`](/repobuddy/typescript/tsconfig/legacy-monorepo/).
- No `lib`, `types`, `outDir`, or `rootDir` is set.

## Examples

This repository's `packages/typescript/tsconfig.base.json`:

```json
{
	"extends": "./tsconfig/monorepo",
	"compilerOptions": {
		"outDir": "esm",
		"rootDir": "src",
		"skipLibCheck": true
	},
	"include": ["src", "types"]
}
```

A package that references another workspace package (`testcases/build-ts/tsconfig.json`):

```json
{
	"extends": "@repobuddy/typescript/tsconfig/monorepo",
	"compilerOptions": {
		"outDir": "esm",
		"rootDir": "src"
	},
	"include": ["src"],
	"references": [
		{
			"path": "../../packages/typescript"
		}
	]
}
```

## Related

- [`tsconfig/legacy/monorepo`](/repobuddy/typescript/tsconfig/legacy-monorepo/)
- [Configure a monorepo package](/repobuddy/typescript/guides/monorepo/)
- [Build CommonJS and ESM from one package](/repobuddy/typescript/guides/dual-cjs-esm-build/)
