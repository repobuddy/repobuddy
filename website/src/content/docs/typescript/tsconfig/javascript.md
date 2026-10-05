---
title: javascript
description: The tsconfig building block that compiles and type checks JavaScript files.
---

Files under `@repobuddy/typescript/tsconfig/javascript/` match the
[JavaScript Support](https://www.typescriptlang.org/tsconfig#JavaScript_Support_6247) category of the TSConfig
reference.

## `javascript/buddy`

Includes `.js` files in the program and type checks them.

```json
{
	"compilerOptions": {
		"allowJs": true,
		"checkJs": true
	}
}
```

| Option | Value | Effect |
| --- | --- | --- |
| `allowJs` | `true` | `.js` files matched by `include` become part of the program. |
| `checkJs` | `true` | Type errors in those `.js` files are reported. |

[`tsconfig/monorepo`](/repobuddy/typescript/tsconfig/monorepo/) does not include this file. Add it to the `extends`
array when a package mixes JavaScript and TypeScript:

```jsonc
// tsconfig.json
{
	"extends": [
		"@repobuddy/typescript/tsconfig/monorepo",
		"@repobuddy/typescript/tsconfig/javascript/buddy"
	]
}
```

## Related

- [tsconfig presets](/repobuddy/typescript/tsconfig/)
