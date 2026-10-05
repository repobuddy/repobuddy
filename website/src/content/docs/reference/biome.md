---
title: '@repobuddy/biome'
description: Two shareable Biome configs, recommended and performant, that set the formatter and tune the linter rules.
---

`@repobuddy/biome` ships two [Biome](https://biomejs.dev) configs. Each one sets the formatter and the linter, so a
project's `biome.json` only has to extend it.

## Install

```sh
# npm
npm install -D @repobuddy/biome

# yarn
yarn add -D @repobuddy/biome

# pnpm
pnpm add -D @repobuddy/biome
```

The package declares `@biomejs/biome >= 2` as a peer dependency. Install Biome alongside it.

## Configs

| Import | File | Use it when |
| --- | --- | --- |
| `@repobuddy/biome` | `recommended.jsonc` | You want the default. Same as `@repobuddy/biome/recommended`. |
| `@repobuddy/biome/recommended` | `recommended.jsonc` | You want to name the config explicitly. |
| `@repobuddy/biome/performant` | `performant.jsonc` | The code is performance-sensitive and some style rules get in the way. |

```jsonc
// biome.json
{
	"extends": ["@repobuddy/biome"]
}
```

```jsonc
// biome.json
{
	"extends": ["@repobuddy/biome/performant"]
}
```

Keys in your own `biome.json` override the ones the preset sets.

## What both configs set

**Files.** Every file is included except `**/.vscode/**/*.txt` and `**/*.md`. Markdown stays excluded because an
earlier Biome release rewrote YAML frontmatter as Markdown headings.

**Formatter.**

| Setting | Value |
| --- | --- |
| `indentStyle` | `tab` |
| `lineEnding` | `lf` |
| `lineWidth` | `120`, and `20` for `package.json` so the output agrees with `sort-package-json` |
| `javascript.formatter.quoteStyle` | `single` |
| `javascript.formatter.semicolons` | `asNeeded` |

**Linter.** Biome's `recommended` rule set is on. These rules change from Biome's default in both configs:

| Rule | Level |
| --- | --- |
| `complexity/noForEach`, `complexity/useLiteralKeys`, `complexity/noCommaOperator` | off |
| `correctness/noUnusedVariables` | error, with `ignoreRestSiblings: true` |
| `correctness/useExhaustiveDependencies` | off |
| `style/noNonNullAssertion`, `style/noParameterAssign`, `style/useTemplate` | off |
| `style/useAsConstAssertion`, `useDefaultParameterLast`, `useEnumInitializers`, `useSelfClosingElements`, `useSingleVarDeclarator`, `noUnusedTemplateLiteral`, `useNumberNamespace`, `noInferrableTypes`, `noUselessElse` | error |
| `style/useNodejsImportProtocol` | error (Biome ships it at `info`, which never fails a run) |
| `suspicious/noAssignInExpressions`, `suspicious/noExplicitAny` | off |

## How the two configs differ

| Setting | `recommended` | `performant` |
| --- | --- | --- |
| `javascript.formatter.trailingCommas` | Biome default (`all`) | `none` |
| `correctness/noUnusedImports` | error, safe fix | Biome default |
| `correctness/noInnerDeclarations` | Biome default | warn |
| `suspicious/noConsole` | error on `console.log`; `info`, `warn`, `error`, `debug`, `table`, `time`, `trace`, and the other diagnostic methods stay allowed | Biome default |
| `suspicious/noVar` | warn | off |
| `assist` organize imports | on | off |
| JSONC parsing for `tsconfig*.json`, `.vscode/**/*.json`, and frontmatter configs | on (comments and trailing commas allowed) | not set |

## Related

- [Packages overview](/repobuddy/reference/packages/): every package in the repository.
- [Biome configuration reference](https://biomejs.dev/reference/configuration/): what each setting does.
