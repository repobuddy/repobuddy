---
'@repobuddy/biome': minor
---

Update biome to 1.8.3 (peer dependency: >= 1.8.0).
Add `trailingCommas` config.

Add `**/*.jsonc` to override.
`biome` is not just using the `jsonc` config to parse JSON files,
it is actually using the `jsonc` parser to parse JSON files.
See https://github.com/biomejs/biome-vscode/issues/285 for more details.

And since `override` is replaced instead of merged,
if you have your own `override`,
you need to add an override for `jsonc` files.

See https://github.com/repobuddy/repobuddy/blob/main/packages/biome/recommended.jsonc#L63 for the recommended override.
