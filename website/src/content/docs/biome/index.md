---
title: '@repobuddy/biome'
description: Two shareable Biome configs, recommended and performant, that set the formatter and tune the linter rules.
---

`@repobuddy/biome` ships two [Biome](https://biomejs.dev) configs as JSONC files. Each one sets the formatter and the
linter, so your `biome.json` only has to extend it.

## Install

```sh
# npm
npm install -D @repobuddy/biome @biomejs/biome

# yarn
yarn add -D @repobuddy/biome @biomejs/biome

# pnpm
pnpm add -D @repobuddy/biome @biomejs/biome
```

The package declares `@biomejs/biome >= 2` as a peer dependency. Install Biome alongside it.

```jsonc
// biome.json
{
	"extends": ["@repobuddy/biome"]
}
```

## Choose a config

| Import | File | Use it when | Reference |
| --- | --- | --- | --- |
| `@repobuddy/biome` | `recommended.jsonc` | You want the default. Same as `@repobuddy/biome/recommended`. | [recommended](/repobuddy/biome/configs/recommended/) |
| `@repobuddy/biome/recommended` | `recommended.jsonc` | You want to name the config explicitly. | [recommended](/repobuddy/biome/configs/recommended/) |
| `@repobuddy/biome/performant` | `performant.jsonc` | The code is performance-sensitive and some style rules get in the way. | [performant](/repobuddy/biome/configs/performant/) |

To see every difference in one table, read [recommended vs performant](/repobuddy/biome/configs/compare/).

## Support

| Area | Support | Source |
| --- | --- | --- |
| Biome | `@biomejs/biome >= 2` (peer dependency). Tested in this repository with 2.5.15. | `packages/biome/package.json` |
| Config format | JSONC files, exported as `.`, `./recommended`, and `./performant`. | `packages/biome/package.json` |
| Module format | Not applicable. The package contains no JavaScript. | `packages/biome/package.json` (`files`) |
| File types | Every file Biome processes, except `**/.vscode/**/*.txt` and `**/*.md`. | `recommended.jsonc`, `performant.jsonc` |
| Formatter | Tabs, `lf`, line width 120, single quotes, semicolons as needed. | both configs |

With the presets applied, Biome 2.5.15 picked up JavaScript, TypeScript, JSX/TSX, JSON, JSONC, CSS, GraphQL, Svelte,
Vue, Astro, and HTML files in a scratch project. It ignored `.yaml` and `.md` files. What Biome supports is Biome's
decision; see the [Biome documentation](https://biomejs.dev).

## Not supported

- Biome 1.x. The peer range is `>= 2`, and the configs use Biome 2 keys (`assist`, `files.includes`).
- Markdown. Both configs exclude `**/*.md`. Biome 2.5 does not process Markdown anyway, and the exclusion stays as a
  guard (see the comment in `recommended.jsonc`).
- YAML linting. Biome does not process `.yaml` files, and the presets add nothing for them. This repository lints YAML
  with ESLint and `eslint-plugin-yml` (`eslint.config.mjs`).
- Tuning for other tools. The presets do not configure ESLint, Prettier, or an editor.

## Guides and reference

- [Adopt Biome with @repobuddy/biome](/repobuddy/biome/guides/adopt/)
- [Override a rule or formatter setting](/repobuddy/biome/guides/override-rules/)
- [Config reference](/repobuddy/biome/configs/)
- [Compatibility matrix](/repobuddy/compatibility/)
