---
title: Packages
description: The npm packages published from the repobuddy repository.
---

Repobuddy publishes each tool as its own package, so you only install what your repository actually uses.

| Package | Description |
| --- | --- |
| [`@repobuddy/biome`](https://npmjs.org/package/@repobuddy/biome) | Predefined [Biome](https://biomejs.dev) configs — `recommended` and `performant` |
| [`@repobuddy/jest`](https://npmjs.org/package/@repobuddy/jest) | [Jest](https://jestjs.io/) presets for JavaScript, TypeScript, CJS, ESM, Node.js, and JSDOM |
| [`@repobuddy/vitest`](https://npmjs.org/package/@repobuddy/vitest) | [Vitest](https://vitest.dev/) presets for Node.js and browser testing |
| [`@repobuddy/typescript`](https://npmjs.org/package/@repobuddy/typescript) | TypeScript configs and utilities for single-package and monorepo setups |
| [`@repobuddy/test`](https://npmjs.org/package/@repobuddy/test) | Shared test utilities used across the repobuddy packages |
| [`repobuddy`](https://npmjs.org/package/repobuddy) | CLI for managing your repository |

## Agent skills

Alongside the packages, the repository ships [agent skills](https://github.com/vercel-labs/skills) for AI
coding assistants:

| Skill | Description |
| --- | --- |
| `create-issue` | Create a bug report or feature request — searches for duplicates first |
| `merge-dep-prs` | Merge pending dependency update PRs — diagnoses CI failures, never merges release PRs |
| `setup-github-pages` | Deploy a static site to GitHub Pages — base path, Actions workflow, Pages source |
| `setup-github-repo` | Set up a GitHub repo with branch protection, Dependabot, and CI |

Install them with:

```sh
npx skills add repobuddy/repobuddy
```

## Further reading

- [Source on GitHub](https://github.com/repobuddy/repobuddy)
