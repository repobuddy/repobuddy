---
title: type-checking
description: The tsconfig building blocks for three levels of type checking strictness.
---

Files under `@repobuddy/typescript/tsconfig/type-checking/` match the
[Type Checking](https://www.typescriptlang.org/tsconfig#Type_Checking_6248) category of the TSConfig reference. Each
file is a superset of the one before it.

| Option | `recommended` | `buddy` | `buddy-strictest` |
| --- | --- | --- | --- |
| `strict` | yes | yes | yes |
| `exactOptionalPropertyTypes` | yes | yes | yes |
| `noPropertyAccessFromIndexSignature` | | yes | yes |
| `noUncheckedIndexedAccess` | | yes | yes |
| `noUnusedLocals` | | yes | yes |
| `noUnusedParameters` | | yes | yes |
| `noFallthroughCasesInSwitch` | | | yes |
| `noImplicitOverride` | | | yes |
| `noImplicitReturns` | | | yes |

The files do not extend each other. Each lists its options in full.

## `type-checking/recommended`

```json
{
	"compilerOptions": {
		"exactOptionalPropertyTypes": true,
		"strict": true
	}
}
```

## `type-checking/buddy`

The recommended type checking settings. Used by [`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/).

```json
{
	"compilerOptions": {
		"exactOptionalPropertyTypes": true,
		"noPropertyAccessFromIndexSignature": true,
		"noUncheckedIndexedAccess": true,
		"noUnusedLocals": true,
		"noUnusedParameters": true,
		"strict": true
	}
}
```

## `type-checking/buddy-strictest`

```json
{
	"compilerOptions": {
		"exactOptionalPropertyTypes": true,
		"noFallthroughCasesInSwitch": true,
		"noImplicitOverride": true,
		"noImplicitReturns": true,
		"noPropertyAccessFromIndexSignature": true,
		"noUncheckedIndexedAccess": true,
		"noUnusedLocals": true,
		"noUnusedParameters": true,
		"strict": true
	}
}
```

To use it with the monorepo preset, put it after the preset so its options win:

```jsonc
// tsconfig.json
{
	"extends": [
		"@repobuddy/typescript/tsconfig/monorepo",
		"@repobuddy/typescript/tsconfig/type-checking/buddy-strictest"
	]
}
```

## Related

- [tsconfig presets](/repobuddy/typescript/tsconfig/)
- [Compose your own tsconfig](/repobuddy/typescript/guides/compose-tsconfig/)
