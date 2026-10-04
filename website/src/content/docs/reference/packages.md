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
