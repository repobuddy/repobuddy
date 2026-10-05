---
title: Compatibility
description: Tool versions, Node.js, module formats, and environments each repobuddy package supports, and what none of them do.
---

This page answers "does it support my setup?" for every package at once. Each package's overview has the full
support section with its sources.

## Tool versions

| Package | Tool peer | Optional peers |
| --- | --- | --- |
| [`repobuddy`](/repobuddy/repobuddy/) | none | none |
| [`@repobuddy/jest`](/repobuddy/jest/) | `jest >=29.5.0` | `@swc/jest ^0.2.31` (required peer, used by the `ts-esm` presets), `ts-jest ^29`, `jest-esm-transformer-2 ^1`, `jest-watch-suspend ^1 \|\| ^2`, `jest-watch-toggle-config ^3`, `jest-watch-typeahead ^3.0.0`, `identity-obj-proxy ^3.0.0` |
| [`@repobuddy/vitest`](/repobuddy/vitest/) | `vitest ^5.0.0` (Vitest 5 only) | `@vitest/browser-playwright ^5.0.0`, for browser tests |
| [`@repobuddy/biome`](/repobuddy/biome/) | `@biomejs/biome >= 2` | none |
| [`@repobuddy/typescript`](/repobuddy/typescript/) | none declared; install the TypeScript your project needs | `repobuddy`, for the `buddy ts` commands |
| [`@repobuddy/test`](/repobuddy/test/) | none; works with any runner | none |

No package declares an `engines` field, so none states a minimum Node.js version.

## Module format and environments

| Package | Module format | Environments |
| --- | --- | --- |
| `repobuddy` | ESM CLI, no importable API; agent plugin | Node.js for the CLI; Claude Code, Cursor, Codex, and GitHub Copilot CLI for the plugin |
| `@repobuddy/jest` | ESM and CommonJS builds; presets for ESM and CommonJS projects. ESM presets need `NODE_OPTIONS=--experimental-vm-modules`. | `node`, `jsdom` (install `jest-environment-jsdom`) |
| `@repobuddy/vitest` | ESM only | `node`, `jsdom`, `happy-dom`, `edge-runtime`; browser mode with Playwright, one headless Chromium instance by default |
| `@repobuddy/biome` | JSONC configs | any project Biome 2 runs on |
| `@repobuddy/typescript` | ESM only for the plugin; tsconfig files are JSON | Node.js, inside the `buddy` CLI |
| `@repobuddy/test` | ESM only | any runner that loads ESM; tested with Vitest (Node.js and Chromium) and Jest in ESM mode |

## TypeScript

| Package | How it handles TypeScript |
| --- | --- |
| `@repobuddy/jest` | `ts-esm` presets transform with `@swc/jest`. `ts-cjs` presets use `ts-jest` with `isolatedModules`. `ts` and `jsdom-ts` pick one from `package.json` `type`. |
| `@repobuddy/vitest` | Adds no transform. Vitest's own transform applies. |
| `@repobuddy/typescript` | `monorepo` and `legacy/monorepo` resolve to the same options on TypeScript 6 and 7. `language/metadata`, `modules/commonjs-legacy`, and `modules/es2020-legacy` report errors on TypeScript 6 and 7. See [tsconfig presets](/repobuddy/typescript/tsconfig/). |

## Single package and monorepo

| Package | Monorepo support |
| --- | --- |
| `repobuddy` | Each command acts on one package. Use `--cwd` for another package. |
| `@repobuddy/jest` | Run Jest in each package, or use `projects` with a base preset per package and `watch` at the root. Source-folder and `type` detection read the directory Jest runs in, so under a root `projects` config set `roots` per project. See [Monorepo](/repobuddy/jest/guides/monorepo/). |
| `@repobuddy/vitest` | One config per environment, run together through `test.projects` in a root config that owns coverage. |
| `@repobuddy/typescript` | `tsconfig/monorepo` sets `composite` for project references and `tsc --build`. |

## Agent plugin

The `repobuddy` package's agent plugin, and the skills it ships, install into Claude Code, Cursor, Codex, and GitHub
Copilot CLI. Some skills need a git host CLI such as
`gh` or `glab`. See [Install the skills](/repobuddy/skills/install/) and each skill's page.

## Not supported

- **Vitest 4 and earlier.** Stay on `@repobuddy/vitest` 2.x to keep Vitest 4.
- **Biome 1.x.**
- **Jest presets for JavaScript in jsdom, happy-dom, or a real browser.** The jsdom presets are TypeScript only.
- **A Babel or ts-jest ESM preset for Jest.** `js-esm` sets no transform, so Jest's default `babel-jest` applies. Compose ts-jest ESM from [`fields`](/repobuddy/jest/api/fields/).
- **Vitest browser providers other than Playwright**, such as WebdriverIO.
- **CommonJS imports** of `@repobuddy/vitest`, `@repobuddy/typescript`, and `@repobuddy/test`.
- **Visual or screenshot testing.** `@repobuddy/vitest` does not provide it.
- **Installing browsers.** Run `npx playwright install chromium` yourself.
- **Markdown and YAML in Biome.** The Biome configs exclude Markdown, and Biome does not process YAML.
- **Vitest configs in `buddy check-deps`.** It reads Jest configs only.
