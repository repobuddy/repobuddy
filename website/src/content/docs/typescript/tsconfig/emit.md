---
title: emit
description: The tsconfig building blocks for declaration files, source maps, and line endings.
---

Files under `@repobuddy/typescript/tsconfig/emit/` match the [Emit](https://www.typescriptlang.org/tsconfig#Emit_6246)
category of the TSConfig reference.

| File | Sets |
| --- | --- |
| [`emit/buddy`](#emitbuddy) | Extends the three files below |
| [`emit/declaration`](#emitdeclaration) | `declaration`, `declarationMap` |
| [`emit/sourcemap`](#emitsourcemap) | `sourceMap` |
| [`emit/line-endings`](#emitline-endings) | `newLine: "lf"` |

## `emit/buddy`

The recommended emit settings. Used by [`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/).

```json
{
	"extends": ["./declaration.json", "./sourcemap.json", "./line-endings.json"]
}
```

Resolved options (`tsc --showConfig`, TypeScript 7.0.2):

```json
{
	"compilerOptions": {
		"declaration": true,
		"declarationMap": true,
		"newLine": "lf",
		"sourceMap": true
	}
}
```

## `emit/declaration`

Emits `.d.ts` files and a `.d.ts.map` for each, so editors jump from a declaration to the source.

```json
{
	"compilerOptions": {
		"declaration": true,
		"declarationMap": true
	}
}
```

## `emit/sourcemap`

Emits a `.js.map` file next to each `.js` file.

```json
{
	"compilerOptions": {
		"sourceMap": true
	}
}
```

## `emit/line-endings`

Writes LF line endings on every platform.

```json
{
	"compilerOptions": {
		"newLine": "lf"
	}
}
```

## Related

- [tsconfig presets](/repobuddy/typescript/tsconfig/)
- [Compose your own tsconfig](/repobuddy/typescript/guides/compose-tsconfig/)
