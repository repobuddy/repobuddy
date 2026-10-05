---
title: recommended
description: The default config. Formats with tabs and single quotes, enables Biome's recommended rules, and changes 23 of them.
---

The default config. It turns on Biome's recommended rule set, then changes the rules listed below.

## Usage

```jsonc
// biome.json
{
	"extends": ["@repobuddy/biome"]
}
```

`@repobuddy/biome/recommended` resolves to the same file, `recommended.jsonc`.

## Options

None. The config takes no parameters. Override settings in your own `biome.json` (see
[Override a rule or formatter setting](/repobuddy/biome/guides/override-rules/)).

## Effective config

This is the content of `packages/biome/recommended.jsonc` with the comments shortened.

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
			"semicolons": "asNeeded"
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
				"noUnusedImports": { "level": "error", "fix": "safe" },
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
				"noConsole": {
					"level": "error",
					"options": {
						"allow": [
							"info", "warn", "error", "assert", "table", "clear", "count", "countReset", "debug",
							"dir", "dirxml", "group", "groupCollapsed", "groupEnd", "time", "timeEnd", "timeLog",
							"trace", "profile", "profileEnd", "timeStamp"
						]
					}
				},
				"noVar": "warn"
			}
		}
	},
	"assist": { "actions": { "source": { "organizeImports": "on" } } },
	"overrides": [
		{
			"includes": [
				"**/frontmatter.json",
				"**/.frontmatter/config/**/*.json",
				"**/.vscode/**/*.json",
				"**/tsconfig*.json"
			],
			"json": { "parser": { "allowComments": true, "allowTrailingCommas": true } }
		},
		{
			"includes": ["**/package.json"],
			"formatter": { "lineWidth": 20 }
		}
	]
}
```

## Files

| Setting | Value |
| --- | --- |
| `files.includes` | `**`, minus `**/.vscode/**/*.txt` and `**/*.md` |

Markdown is excluded because Biome 2.4.15 rewrote YAML frontmatter as Markdown headings. Biome 2.5 does not process
Markdown, so the exclusion has no effect today.

## Formatter

| Setting | Value |
| --- | --- |
| `formatter.enabled` | `true` |
| `formatter.indentStyle` | `tab` |
| `formatter.lineEnding` | `lf` |
| `formatter.lineWidth` | `120` |
| `javascript.formatter.quoteStyle` | `single` |
| `javascript.formatter.semicolons` | `asNeeded` |
| `javascript.formatter.trailingCommas` | not set (Biome default, `all`) |
| `**/package.json` `formatter.lineWidth` | `20`, so the output matches `sort-package-json` |

## Linter

`linter.enabled` is `true` and `recommended` is `true`. The table lists every rule the config changes. The last column
is the level Biome 2.5.15 reported for the same code with an empty config (`{}`); "not reported" means it produced no
diagnostic.

| Rule | Level | Options | Biome default (2.5.15) | What it flags |
| --- | --- | --- | --- | --- |
| `complexity/noForEach` | off | none | not reported | `.forEach()` calls |
| `complexity/useLiteralKeys` | off | none | info | `x['y']` instead of `x.y` |
| `complexity/noCommaOperator` | off | none | warn | `(1, 2)` |
| `correctness/noUnusedImports` | error | `fix: safe` | warn | Imports never used |
| `correctness/noUnusedVariables` | error | `ignoreRestSiblings: true` | warn | Variables never read |
| `correctness/useExhaustiveDependencies` | off | none | not reported | React hook dependency lists |
| `style/noNonNullAssertion` | off | none | warn | `value!` |
| `style/noParameterAssign` | off | none | not reported | Assigning to a parameter |
| `style/useTemplate` | off | none | info | `a + 'b'` instead of a template |
| `style/useAsConstAssertion` | error | none | not reported | `1 as 1` instead of `as const` |
| `style/useDefaultParameterLast` | error | none | not reported | A default parameter before a required one |
| `style/useEnumInitializers` | error | none | not reported | Enum members without initializers |
| `style/useSelfClosingElements` | error | none | not reported | `<div></div>` |
| `style/useSingleVarDeclarator` | error | none | not reported | `const a = 1, b = 2` |
| `style/noUnusedTemplateLiteral` | error | none | not reported | A template literal with no interpolation |
| `style/useNumberNamespace` | error | none | not reported | `parseInt`, `isNaN` instead of `Number.*` |
| `style/noInferrableTypes` | error | none | not reported | `const x: number = 1` |
| `style/noUselessElse` | error | none | not reported | `else` after `return` |
| `style/useNodejsImportProtocol` | error | none | info | `'assert'` instead of `'node:assert'` |
| `suspicious/noAssignInExpressions` | off | none | error | `if ((x = 1))` |
| `suspicious/noExplicitAny` | off | none | warn | `: any` |
| `suspicious/noConsole` | error | `allow`: every console method except `log` | not reported | `console.log()` |
| `suspicious/noVar` | warn | none | not reported | `var` |

`useNodejsImportProtocol` is `info` in Biome, which prints the finding and exits `0`. The config raises it to `error`
so it fails the run. The `node:` prefix distinguishes a builtin from a package of the same name on the registry.

The `noConsole` allow list is: `info`, `warn`, `error`, `assert`, `table`, `clear`, `count`, `countReset`, `debug`,
`dir`, `dirxml`, `group`, `groupCollapsed`, `groupEnd`, `time`, `timeEnd`, `timeLog`, `trace`, `profile`,
`profileEnd`, and `timeStamp`.

## Assist

| Action | Value |
| --- | --- |
| `assist.actions.source.organizeImports` | `on` |

## Overrides

| `includes` | Effect |
| --- | --- |
| `**/frontmatter.json`, `**/.frontmatter/config/**/*.json`, `**/.vscode/**/*.json`, `**/tsconfig*.json` | `json.parser.allowComments` and `allowTrailingCommas` are `true` |
| `**/package.json` | `formatter.lineWidth` is `20` |

## Examples

Each fixture under `packages/biome/tests/recommended` exercises one rule. The command
`pnpm --filter @repobuddy/biome check:preset` lints them with `--error-on-warnings`. A rule that stops firing leaves an
unused `biome-ignore`, which fails that command.

Flagged at `error` (the fixture carries a `biome-ignore` for the rule):

```ts
// style/useNodejsImportProtocol
import { deepEqual } from 'assert'

// suspicious/noConsole
console.log()

// correctness/noUnusedImports
import { deepEqual } from 'node:assert'

// correctness/noUnusedVariables
const unusedVar = 0
```

Flagged at `warn`:

```ts
// suspicious/noVar
export function hello(): string {
	var greeting = 'Hello World!'
	return greeting
}
```

Accepted because the rule is `off`:

```ts
// complexity/noForEach
;[].forEach((x) => void console.info(x))

// complexity/useLiteralKeys, with an index signature in the type
console.info(x['y'])

// style/useTemplate
export const s = foo + 'b'

// correctness/useExhaustiveDependencies: functions need not be listed as dependencies
useEffect(() => {
	fn()
}, [])
```

Accepted `console` methods (fixture `suspicious/no_console_log.ts`): `info`, `warn`, `error`, `assert`, `table`,
`clear`, `count`, `countReset`, `debug`, `dir`, `dirxml`, `group`, `groupCollapsed`, `groupEnd`, `time`, `timeEnd`,
`timeLog`, `trace`, `profile`, `profileEnd`, and `timeStamp`.

The fixture `formatter/tailing_comma.ts` shows the formatter's output: multi-line parameter lists end with a trailing
comma.

## Related

- [performant](/repobuddy/biome/configs/performant/) and [recommended vs performant](/repobuddy/biome/configs/compare/)
- [Override a rule or formatter setting](/repobuddy/biome/guides/override-rules/)
- [Biome configuration reference](https://biomejs.dev/reference/configuration/)
