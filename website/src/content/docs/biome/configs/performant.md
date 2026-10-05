---
title: performant
description: A variant of recommended for performance-sensitive code that drops trailing commas, import organizing, and several rules.
---

A variant of [recommended](/repobuddy/biome/configs/recommended/) for projects where performance is a priority and
some lint rules get in the way.

## Usage

```jsonc
// biome.json
{
	"extends": ["@repobuddy/biome/performant"]
}
```

## Options

None. The config takes no parameters.

## Effective config

This is the content of `packages/biome/performant.jsonc`.

```jsonc
{
	"files": {
		"includes": ["**", "!**/.vscode/**/*.txt", "!**/*.md"]
	},
	"formatter": {
		"enabled": true,
		"indentStyle": "tab",
		"lineEnding": "lf",
		"lineWidth": 120
	},
	"javascript": {
		"formatter": {
			"quoteStyle": "single",
			"semicolons": "asNeeded",
			"trailingCommas": "none"
		}
	},
	"linter": {
		"enabled": true,
		"rules": {
			"recommended": true,
			"complexity": {
				"noForEach": "off",
				"useLiteralKeys": "off",
				"noCommaOperator": "off"
			},
			"correctness": {
				"noInnerDeclarations": "warn",
				"noUnusedVariables": { "level": "error", "options": { "ignoreRestSiblings": true } },
				"useExhaustiveDependencies": "off"
			},
			"style": {
				"noNonNullAssertion": "off",
				"noParameterAssign": "off",
				"useTemplate": "off",
				"useAsConstAssertion": "error",
				"useDefaultParameterLast": "error",
				"useEnumInitializers": "error",
				"useSelfClosingElements": "error",
				"useSingleVarDeclarator": "error",
				"noUnusedTemplateLiteral": "error",
				"useNumberNamespace": "error",
				"noInferrableTypes": "error",
				"noUselessElse": "error",
				"useNodejsImportProtocol": "error"
			},
			"suspicious": {
				"noAssignInExpressions": "off",
				"noExplicitAny": "off",
				"noVar": "off"
			}
		}
	},
	"assist": { "actions": { "source": { "organizeImports": "off" } } },
	"overrides": [
		{
			"includes": ["**/package.json"],
			"formatter": { "lineWidth": 20 }
		}
	]
}
```

## Files

Identical to `recommended`: `**`, minus `**/.vscode/**/*.txt` and `**/*.md`.

## Formatter

Same as `recommended` (tabs, `lf`, width 120, single quotes, semicolons as needed, `package.json` width 20), with one
change: `javascript.formatter.trailingCommas` is `none`.

## Linter

`linter.enabled` and `recommended` are `true`. The rules below are the same as in `recommended`, with the same levels
and options: `noForEach`, `useLiteralKeys`, `noCommaOperator`, `noUnusedVariables`, `useExhaustiveDependencies`,
`noNonNullAssertion`, `noParameterAssign`, `useTemplate`, `useAsConstAssertion`, `useDefaultParameterLast`,
`useEnumInitializers`, `useSelfClosingElements`, `useSingleVarDeclarator`, `noUnusedTemplateLiteral`,
`useNumberNamespace`, `noInferrableTypes`, `noUselessElse`, `useNodejsImportProtocol`, `noAssignInExpressions`, and
`noExplicitAny`. See [recommended](/repobuddy/biome/configs/recommended/#linter) for what each rule flags.

The rules that differ from `recommended`:

| Rule | Level in `performant` | Biome default (2.5.15) | Effect |
| --- | --- | --- | --- |
| `correctness/noInnerDeclarations` | warn | error | Reports `var` and function declarations in nested blocks as warnings. |
| `correctness/noUnusedImports` | not set | warn | Reports unused imports as warnings, not errors. |
| `suspicious/noVar` | off | not reported | `var` is accepted. |
| `suspicious/noConsole` | not set | not reported | `console.log()` is accepted. |

## Assist

| Action | Value |
| --- | --- |
| `assist.actions.source.organizeImports` | `off` |

## Overrides

| `includes` | Effect |
| --- | --- |
| `**/package.json` | `formatter.lineWidth` is `20` |

There is no JSON parser override, so comments and trailing commas in `tsconfig*.json` and `.vscode/**/*.json` follow
Biome's own parsing.

## Examples

Each fixture under `packages/biome/tests/performant` exercises one rule.

Flagged at `error`:

```ts
// style/useNodejsImportProtocol
import { deepEqual } from 'assert'
```

Flagged at `warn`:

```ts
// correctness/noInnerDeclarations
export function noInnerDeclarations(): string {
	const greeting = 'Hello World!'
	if (greeting) {
		var c = greeting[0]
		return c!
	}
	return greeting
}
```

Accepted because the rule is `off`:

```ts
// suspicious/noVar
export function hello(): string {
	var greeting = 'Hello World!'
	return greeting
}

// complexity/noForEach
;[].forEach((x) => void console.info(x))

// style/useTemplate
export const s = foo + 'b'
```

## Related

- [recommended](/repobuddy/biome/configs/recommended/) and [recommended vs performant](/repobuddy/biome/configs/compare/)
- [Override a rule or formatter setting](/repobuddy/biome/guides/override-rules/)
