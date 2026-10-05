---
title: language
description: The tsconfig building blocks for the output language level, decorator metadata, and JSX.
---

Files under `@repobuddy/typescript/tsconfig/language/` match the
[Language and Environment](https://www.typescriptlang.org/tsconfig#Language_and_Environment_6254) category of the
TSConfig reference.

| File | Sets |
| --- | --- |
| [`language/buddy`](#languagebuddy) | `target: "ES2020"`, `useDefineForClassFields` |
| [`language/metadata`](#languagemetadata) | `emitDecoratorMetadata` |
| [`language/react`](#languagereact) | `jsx: "react-jsx"` |

## `language/buddy`

The recommended language settings. Used by [`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/).

```json
{
	"compilerOptions": {
		"target": "ES2020",
		"useDefineForClassFields": true
	}
}
```

- `target: ES2020` emits ES2020 syntax and loads the ES2020 `lib` by default.
- `useDefineForClassFields` emits class fields with ECMAScript `[[Define]]` semantics.
- Extended on its own, `tsc --showConfig` (TypeScript 7.0.2) also lists `module: es2020`, derived from `target`.
  Extend a [modules](/repobuddy/typescript/tsconfig/modules/) file to choose the module system.

## `language/metadata`

Emits design-type metadata for decorated declarations.

```json
{
	"compilerOptions": {
		"emitDecoratorMetadata": true
	}
}
```

This file does not set `experimentalDecorators`. TypeScript 6.0.3 and 7.0.2 both report `TS5052: Option
'emitDecoratorMetadata' cannot be specified without specifying option 'experimentalDecorators'` until your config sets
it:

```jsonc
// tsconfig.json
{
	"extends": [
		"@repobuddy/typescript/tsconfig/monorepo",
		"@repobuddy/typescript/tsconfig/language/metadata"
	],
	"compilerOptions": {
		"experimentalDecorators": true
	}
}
```

## `language/react`

Compiles JSX with the React 17+ automatic runtime (`react/jsx-runtime`).

```json
{
	"compilerOptions": {
		"jsx": "react-jsx"
	}
}
```

## Related

- [tsconfig presets](/repobuddy/typescript/tsconfig/)
- [Compose your own tsconfig](/repobuddy/typescript/guides/compose-tsconfig/)
