---
"@repobuddy/biome": minor
---

Enable the linter's recommended rules with `"preset": "recommended"` instead of the deprecated `"recommended": true`, in both `recommended` and `performant`. Biome 2.6 warns on every run that the `recommended` field will be removed in the next major version. `preset` needs Biome 2.5.0 or later, so the `@biomejs/biome` peer dependency is now `>= 2.5.0`.
