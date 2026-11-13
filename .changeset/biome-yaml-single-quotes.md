---
'@repobuddy/biome': minor
---

Format YAML with single quotes in both `recommended` and `performant` (`yaml.formatter.quoteStyle: "single"`). Biome 2.6 formats YAML with double quotes by default, while pnpm and Renovate write `pnpm-workspace.yaml` with single quotes, so every pnpm or Renovate edit to that file failed `biome check`. Consumers can drop a local `yaml` override that does the same. Biome 2.5 rejects the `yaml` config key, so the `@biomejs/biome` peer dependency is now `>= 2.6.0`.
