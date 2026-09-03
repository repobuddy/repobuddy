---
'@repobuddy/biome': minor
---

Raise `style/useNodejsImportProtocol` to `error` in both `recommended` and `performant`.

Biome ships this rule at `info`, which does not fail `biome check` — a bare
`import 'fs'` passed lint silently. A bare specifier resolves to a userland
package if one is installed under that name, so the `node:` prefix is a
correctness guard rather than a style preference.

Repos that pick up this release may see new lint errors. Biome classifies the
fix as unsafe (it rewrites the specifier), so apply it with
`biome check --fix --unsafe` rather than a plain `--fix`.
