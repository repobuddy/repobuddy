---
title: recommended vs performant
description: Every difference between the recommended and performant Biome configs in one table.
---

The two configs share `files.includes`, the formatter (except trailing commas), and these rules: `noForEach`,
`useLiteralKeys`, `noCommaOperator`, `noUnusedVariables`, `useExhaustiveDependencies`, `noNonNullAssertion`,
`noParameterAssign`, `useTemplate`, the style rules promoted to `error`, `noAssignInExpressions`, and `noExplicitAny`.

These settings differ:

| Setting | [recommended](/repobuddy/biome/configs/recommended/) | [performant](/repobuddy/biome/configs/performant/) |
| --- | --- | --- |
| `javascript.formatter.trailingCommas` | not set (Biome default, `all`) | `none` |
| `correctness/noUnusedImports` | error, `fix: safe` | not set (Biome default: warn) |
| `correctness/noInnerDeclarations` | not set (Biome default: error) | warn |
| `suspicious/noConsole` | error; every console method except `log` is allowed | not set (`console.log` accepted) |
| `suspicious/noVar` | warn | off |
| `assist.actions.source.organizeImports` | `on` | `off` |
| Override: `json.parser` allows comments and trailing commas for `frontmatter.json`, `.frontmatter/config/**/*.json`, `.vscode/**/*.json`, `tsconfig*.json` | yes | no |

## Choose

- Pick `recommended` when you want unused imports to fail, `console.log` blocked, and imports sorted by `biome check`.
- Pick `performant` when you want trailing commas removed and the rules above relaxed.

Both configs set `style/useNodejsImportProtocol` to `error`, so `import 'assert'` fails in either.

Back to the [overview](/repobuddy/biome/).
