---
title: Packages
description: The npm packages published from the repobuddy repository, and where each one's documentation starts.
---

Repobuddy publishes each tool as its own package, so you only install what your repository uses.

| Package | What it provides | Docs |
| --- | --- | --- |
| [`repobuddy`](https://npmjs.org/package/repobuddy) | The `buddy` CLI, and the agent plugin that ships the skills | [Overview](/repobuddy/repobuddy/), [CLI](/repobuddy/cli/), [agent plugin](/repobuddy/skills/) |
| [`@repobuddy/jest`](https://npmjs.org/package/@repobuddy/jest) | [Jest](https://jestjs.io/) presets for TypeScript and JavaScript, ESM and CommonJS, Node.js and jsdom, plus config building blocks | [Overview](/repobuddy/jest/), [presets](/repobuddy/jest/presets/), [API](/repobuddy/jest/api/) |
| [`@repobuddy/vitest`](https://npmjs.org/package/@repobuddy/vitest) | [Vitest](https://vitest.dev/) presets for Node.js and Playwright browser tests | [Overview](/repobuddy/vitest/), [reference](/repobuddy/vitest/reference/) |
| [`@repobuddy/biome`](https://npmjs.org/package/@repobuddy/biome) | Two [Biome](https://biomejs.dev) configs, `recommended` and `performant` | [Overview](/repobuddy/biome/), [configs](/repobuddy/biome/configs/) |
| [`@repobuddy/typescript`](https://npmjs.org/package/@repobuddy/typescript) | Composable `tsconfig` presets and the `buddy ts` CLI plugin | [Overview](/repobuddy/typescript/), [tsconfig presets](/repobuddy/typescript/tsconfig/), [CLI plugin](/repobuddy/typescript/cli/) |
| [`@repobuddy/test`](https://npmjs.org/package/@repobuddy/test) | `expect.order` and `isRunningInTest()`, for any test runner | [Overview](/repobuddy/test/), [API](/repobuddy/test/api/) |

## Choose by what you want to do

| I want to | Install | Start here |
| --- | --- | --- |
| Write `test`/`coverage` scripts, check Jest dependencies | `repobuddy` (CLI) | [The `buddy` CLI](/repobuddy/cli/) |
| Give a coding agent repo chores (issues, dependency PRs, repo setup) | `repobuddy` (agent plugin) | [Agent skills](/repobuddy/skills/) |
| Test with Jest | `@repobuddy/jest` | [Choose a Jest preset](/repobuddy/jest/) |
| Test with Vitest in Node.js or jsdom | `@repobuddy/vitest` | [Run Node.js tests](/repobuddy/vitest/guides/node-tests/) |
| Run browser tests (Vitest + Playwright) | `@repobuddy/vitest` | [Run browser tests](/repobuddy/vitest/guides/browser-tests/) |
| Assert the order code runs in | `@repobuddy/vitest` or `@repobuddy/test` | [`expect.order` with Vitest](/repobuddy/vitest/guides/expect-order/), [with Jest](/repobuddy/test/guides/expect-order-with-jest/) |
| Lint and format with Biome | `@repobuddy/biome` | [Adopt a Biome preset](/repobuddy/biome/guides/adopt/) |
| Configure TypeScript (`tsconfig`) | `@repobuddy/typescript` | [Configure a monorepo package](/repobuddy/typescript/guides/monorepo/) |
| Build a package as CommonJS and ESM | `@repobuddy/typescript` + `repobuddy` | [Build CommonJS and ESM](/repobuddy/typescript/guides/dual-cjs-esm-build/) |

Each package's overview has its install command and the peer dependencies to install with it. The `repobuddy` agent
plugin installs through your coding agent, not as a dependency. See
[the `repobuddy` package](/repobuddy/repobuddy/#install-the-agent-plugin).

For the tool versions, module formats, and environments each package supports, see
[Compatibility](/repobuddy/compatibility/).

- [Source on GitHub](https://github.com/repobuddy/repobuddy)
