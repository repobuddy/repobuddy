---
title: modules
description: The tsconfig building blocks that choose the module system, module resolution, and importable file types.
---

Files under `@repobuddy/typescript/tsconfig/modules/` match the
[Modules](https://www.typescriptlang.org/tsconfig#Modules_6244) category of the TSConfig reference. Extend one module
file per config.

| File | `module` | `moduleResolution` | Other options |
| --- | --- | --- | --- |
| [`modules/buddy`](#modulesbuddy) | `Node16` | derived: `node16` | `resolveJsonModule` |
| [`modules/buddy-commonjs`](#modulesbuddy-commonjs) | `CommonJS` | not set | `esModuleInterop`, `resolveJsonModule`, `verbatimModuleSyntax: false` |
| [`modules/node16`](#modulesnode16) | `Node16` | derived: `node16` | none |
| [`modules/nodenext`](#modulesnodenext) | `NodeNext` | derived: `nodenext` | none |
| [`modules/commonjs`](#modulescommonjs) | `CommonJS` | not set | none |
| [`modules/commonjs-legacy`](#modulescommonjs-legacy) | `CommonJS` | `Node16` | none |
| [`modules/es2020`](#moduleses2020) | `ES2020` | `Bundler` | none |
| [`modules/es2020-legacy`](#moduleses2020-legacy) | `ES2020` | `Node` | none |
| [`modules/es2022`](#moduleses2022) | `ES2022` | `Bundler` | none |
| [`modules/ui-assets`](#modulesui-assets) | not set | not set | `allowArbitraryExtensions`, `resolveJsonModule` |

"Derived" values come from `tsc --showConfig` (TypeScript 7.0.2). The file does not set them.

## `modules/buddy`

The recommended module settings for a Node.js package. Used by
[`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/).

```jsonc
{
	"compilerOptions": {
		"module": "Node16",
		"resolveJsonModule": true
		// disabled due to `ts-jest` issue.
		// "verbatimModuleSyntax": true
	}
}
```

Resolved options (`tsc --showConfig`, TypeScript 7.0.2):

```json
{
	"compilerOptions": {
		"module": "node16",
		"resolveJsonModule": true,
		"moduleResolution": "node16",
		"moduleDetection": "force"
	}
}
```

`verbatimModuleSyntax` stays off. With it on, `ts-jest` reports
`TS1286: ESM syntax is not allowed in a CommonJS module` for ESM projects.

## `modules/buddy-commonjs`

The CommonJS counterpart of `modules/buddy`. Put it after your base config in an `extends` array to build a CommonJS
copy of an ESM package.

```jsonc
{
	"compilerOptions": {
		"esModuleInterop": true,
		"module": "CommonJS",
		"resolveJsonModule": true,
		"verbatimModuleSyntax": false // reset to false for config composition
	}
}
```

`verbatimModuleSyntax: false` overrides a `true` value from a config earlier in the `extends` array.

This repository builds `packages/jest` and `packages/buddy` CommonJS output with it. See
[Build CommonJS and ESM from one package](/repobuddy/typescript/guides/dual-cjs-esm-build/).

## `modules/node16`

```jsonc
{
	"compilerOptions": {
		"module": "Node16"
		// This is inferred for `module: Node16`
		// "moduleResolution": "Node16"
	}
}
```

TypeScript derives `moduleResolution: node16` and `moduleDetection: force`. Unlike `modules/buddy`, this file does not
turn on `resolveJsonModule`.

## `modules/nodenext`

```jsonc
{
	"compilerOptions": {
		"module": "NodeNext"
		// This is inferred for `module: NodeNext`
		// "moduleResolution": "NodeNext"
	}
}
```

TypeScript derives `moduleResolution: nodenext` and `moduleDetection: force`.

## `modules/commonjs`

```jsonc
{
	"compilerOptions": {
		"module": "CommonJS"
		// this is no longer possible starting from TypeScript 5.2
		// "moduleResolution": "Node16"
	}
}
```

`moduleResolution` is left to TypeScript's default for `CommonJS`.

## `modules/commonjs-legacy`

```json
{
	"compilerOptions": {
		"module": "CommonJS",
		"moduleResolution": "Node16"
	}
}
```

For TypeScript older than 5.2. TypeScript 6.0.3 and 7.0.2 reject it with `TS5110: Option 'module' must be set to
'Node16' when option 'moduleResolution' is set to 'Node16'`. On those versions, use
[`modules/commonjs`](#modulescommonjs).

## `modules/es2020`

For code that a bundler consumes.

```json
{
	"compilerOptions": {
		"module": "ES2020",
		"moduleResolution": "Bundler"
	}
}
```

`moduleResolution: Bundler` needs TypeScript 5.0 or later.

## `modules/es2020-legacy`

```json
{
	"compilerOptions": {
		"module": "ES2020",
		"moduleResolution": "Node"
	}
}
```

For TypeScript older than 5.0, which has no `Bundler` resolution. TypeScript 6.0.3 reports `TS5107`
(`moduleResolution=node10` is deprecated) and TypeScript 7.0.2 reports `TS5108` (`moduleResolution=node10` has been
removed). On those versions, use [`modules/es2020`](#moduleses2020).

## `modules/es2022`

For code that a bundler consumes, with ES2022 module features such as top-level `await`.

```json
{
	"compilerOptions": {
		"module": "ES2022",
		"moduleResolution": "Bundler"
	}
}
```

## `modules/ui-assets`

Lets code import JSON files and files with non-TypeScript extensions, such as `.css`, when a matching declaration file
exists (for example `styles.d.css.ts` for `styles.css`).

```jsonc
{
	"compilerOptions": {
		// https://www.typescriptlang.org/tsconfig#allowArbitraryExtensions
		"allowArbitraryExtensions": true,
		"resolveJsonModule": true
	}
}
```

It sets no `module`. Combine it with one of the module files above. `allowArbitraryExtensions` needs TypeScript 5.0
or later.

## Related

- [tsconfig presets](/repobuddy/typescript/tsconfig/)
- [interop](/repobuddy/typescript/tsconfig/interop/)
- [Build CommonJS and ESM from one package](/repobuddy/typescript/guides/dual-cjs-esm-build/)
