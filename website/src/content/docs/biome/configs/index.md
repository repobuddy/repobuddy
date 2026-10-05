---
title: Configs
description: Reference for the two Biome configs that @repobuddy/biome exports.
---

The package exports two configs. Both are static JSONC files, so the effective config is the file content.

| Config | Import | Purpose |
| --- | --- | --- |
| [recommended](/repobuddy/biome/configs/recommended/) | `@repobuddy/biome` or `@repobuddy/biome/recommended` | The default. Enforces more rules and organizes imports. |
| [performant](/repobuddy/biome/configs/performant/) | `@repobuddy/biome/performant` | Drops the rules that constrain performance-sensitive code. |
| [recommended vs performant](/repobuddy/biome/configs/compare/) | none | Every difference in one table. |

Both configs share the same `files`, formatter, and most linter rules. The compare page lists what differs.

Back to the [overview](/repobuddy/biome/).
