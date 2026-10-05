---
title: Packages
description: The npm packages published from the repobuddy repository.
---

Repobuddy publishes each tool as its own package, so you only install what your repository actually uses.

| Package | What it provides | Reference |
| --- | --- | --- |
| [`@repobuddy/biome`](https://npmjs.org/package/@repobuddy/biome) | Two [Biome](https://biomejs.dev) configs, `recommended` and `performant` | [biome](/repobuddy/reference/biome/) |
| [`@repobuddy/jest`](https://npmjs.org/package/@repobuddy/jest) | [Jest](https://jestjs.io/) presets for TypeScript and JavaScript, ESM and CommonJS, Node.js and jsdom | [jest](/repobuddy/reference/jest/) |
| [`@repobuddy/vitest`](https://npmjs.org/package/@repobuddy/vitest) | [Vitest](https://vitest.dev/) presets for Node.js and Playwright browser tests | [vitest](/repobuddy/reference/vitest/) |
| [`@repobuddy/typescript`](https://npmjs.org/package/@repobuddy/typescript) | Composable `tsconfig` presets and the `buddy ts` CLI plugin | [typescript](/repobuddy/reference/typescript/) |
| [`@repobuddy/test`](https://npmjs.org/package/@repobuddy/test) | `expect.order` and `isRunningInTest()`, for any test runner | [test](/repobuddy/reference/test/) |
| [`repobuddy`](https://npmjs.org/package/repobuddy) | The `buddy` CLI, and the agent plugin that ships the skills below | [repobuddy](/repobuddy/reference/repobuddy/) |

## Supported environments

| Package | Module format | Runtime | Peer dependencies |
| --- | --- | --- | --- |
| `@repobuddy/biome` | JSONC configs | Biome | `@biomejs/biome >= 2` |
| `@repobuddy/jest` | ESM and CommonJS | Node.js, jsdom | `jest >= 29.5.0`, `@swc/jest`, and optional transformers and watch plugins |
| `@repobuddy/vitest` | ESM | Node.js, jsdom, happy-dom, edge-runtime, Playwright browsers | `vitest ^4.0.15`, optional `@vitest/browser-playwright` |
| `@repobuddy/typescript` | ESM, plus JSON tsconfigs | TypeScript, Node.js | none |
| `@repobuddy/test` | ESM | any test runner | none |
| `repobuddy` | ESM CLI | Node.js | none |

## Agent skills

Alongside the packages, the repository ships [agent skills](https://github.com/vercel-labs/skills) for AI
coding assistants:

| Skill | Description |
| --- | --- |
| `add-badges` | Add a status badge row to a readme — npm, CI or release, docs, coverage, and license — using only badges the repo can back |
| `agent-readiness` | Score how ready a repo is for coding agents — a level and the top three fixes — then apply the fixes or benchmark agent cost |
| `code-review` | Review a change set through three engineering lenses — Linus, Uncle Bob, and Fowler — and report where they disagree |
| `create-issue` | Create a bug report or feature request on GitHub or GitLab — searches for duplicates first |
| `init-buddy` | Get a machine ready for the repo's git host — install and log in its CLI, then offer allow and deny lists for your agent harness |
| `llms-txt` | Publish an `llms.txt` generated from a project's public surface, with a CI drift check |
| `merge-dep-prs` | Merge pending dependency update PRs — gates each merge on whether CI reached what the change can break, fixes the ones that fail, never touches release PRs |
| `min-release-age` | Lift the minimum-release-age gate for one package version, and schedule its removal once the version ages past the window |
| `review-api` | Review a library's public API for consistency and completeness, against the library's own conventions |
| `review-permissions` | Review what your coding agents are allowed to do across every harness — a risk-ranked list and a tighter config |
| `session` | `pause` an agent session into one checkpoint per topic, in another repo when the work belongs there, and `resume` one without reopening settled decisions |
| `setup-github-repo` | Set up a GitHub repo with branch protection, a merge backstop, Dependabot, and CI |
| `setup-npm-trusted-publishing` | Register npm trusted publishers (OIDC) so CI publishes without `NPM_TOKEN` — one package, an org, or every org you own |
| `to-question` | Word a technical question for a platform — Slack, Jira, GitHub, email, and more — and copy it to the clipboard |
| `website` | Work on a repo's docs website — `init` adds an Astro/Starlight site to a monorepo; `deploy` publishes a static site to GitHub, GitLab, or Codeberg Pages, Bitbucket, or Azure Static Web Apps |

Install them with:

```sh
npx skills add repobuddy/repobuddy
```

## Further reading

- [Source on GitHub](https://github.com/repobuddy/repobuddy)
