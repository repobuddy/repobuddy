# Your repository buddy

[![GitHub NodeJS][github-nodejs]][github-action-url]
[![Visual Studio Code][vscode-image]][vscode-url]

[`repobuddy`] helps you to manage your repository.

## Agent Skills

`repobuddy` provides [agent skills] for AI coding assistants (Claude Code, Cursor, etc.) to help manage your repository. Skills live in [`packages/buddy/skills/`](./packages/buddy/skills/), ship inside the [`repobuddy`] npm package, and are installed with the [Skills CLI].

### Available Skills

| Skill | Description |
| --- | --- |
| [`create-issue`] | Create a bug report or feature request — searches for duplicates first |
| [`merge-dep-prs`] | Merge pending dependency update PRs — diagnoses CI failures, never merges release PRs |
| [`setup-github-pages`] | Deploy a static site to GitHub Pages — base path, Actions workflow, and Pages source |
| [`setup-github-repo`] | Set up a GitHub repo with branch protection, Dependabot, and CI |

### Installing Skills

**List available skills:**

```sh
npx skills add repobuddy/repobuddy --list
```

**Install all skills:**

```sh
npx skills add repobuddy/repobuddy
```

**Install specific skills:**

```sh
npx skills add repobuddy/repobuddy --skill create-issue --skill setup-github-repo
```

**Install from npm:**

The skills also ship inside the [`repobuddy`] package as a [universal plugin], so installing the
package makes them available to Claude Code, Cursor, Codex, and GitHub Copilot CLI:

```sh
npm install repobuddy
npx skills experimental_sync
```

### Installing as a Plugin

This repository is also a plugin marketplace — `.claude-plugin/marketplace.json` lists the
`repobuddy` plugin, and every runtime below reads that catalog.

**Claude Code**

```
/plugin marketplace add repobuddy/repobuddy
/plugin install repobuddy@repobuddy
```

**Codex**

```sh
codex plugin marketplace add repobuddy/repobuddy
codex plugin add repobuddy@repobuddy
```

**GitHub Copilot CLI**

```sh
copilot plugin marketplace add repobuddy/repobuddy
copilot plugin install repobuddy@repobuddy
```

Start a new session before using the plugin.

Cursor has no command-line install; a workspace admin imports the catalog from
Dashboard → Plugins → Team Marketplaces → Add Marketplace → Import from Repo.

**Via Claude Code** — ask Claude to find and install a skill:

```
find a skill for creating issues
```

or install directly:

```
/find-skills repobuddy/repobuddy
```

### Related Skill Collections

These companion repositories provide additional skills often used alongside `repobuddy`:

| Repository | Skills |
| --- | --- |
| [`repobuddy/agent-changesets`] | Changeset authoring and release setup |
| [`repobuddy/agent-security`] | Security PR remediation |

Install from a related repo the same way:

```sh
npx skills add repobuddy/agent-changesets
```

## [@repobuddy/biome]

[![NPM version][npm-biome-image]][npm-biome-url] [![NPM downloads][downloads-biome-image]][npm-biome-url] [![Codecov][codecov-biome-image]][codecov-biome-url]

> Contains predefined configs for [biome].

## [@repobuddy/jest]

[![NPM version][npm-jest-image]][npm-jest-url] [![NPM downloads][downloads-jest-image]][npm-jest-url] [![Codecov][codecov-jest-image]][codecov-jest-url]

> Contains various presets and config to customize [jest].

## [@repobuddy/test]

[![NPM version][npm-test-image]][npm-test-url] [![NPM downloads][downloads-test-image]][npm-test-url]

> Shared test utilities used across the `repobuddy` packages.

## [@repobuddy/typescript]

[![NPM version][npm-ts-image]][npm-ts-url] [![NPM downloads][downloads-ts-image]][npm-ts-url] [![Codecov][codecov-ts-image]][codecov-ts-url]

> Provides tools and utilities to take care of [TypeScript] stuffs, so you don't have to.

## [@repobuddy/vitest]

[![NPM version][npm-vitest-image]][npm-vitest-url] [![NPM downloads][downloads-vitest-image]][npm-vitest-url]

> Contains various presets and config to customize [vitest].

## [repobuddy]

[![NPM version][npm-cli-image]][npm-cli-url] [![NPM downloads][downloads-cli-image]][npm-cli-url]

> CLI for managing your repository.

[@repobuddy/biome]: ./packages/biome/readme.md
[@repobuddy/jest]: ./packages/jest/readme.md
[@repobuddy/test]: ./packages/test/readme.md
[@repobuddy/typescript]: ./packages/typescript/readme.md
[@repobuddy/vitest]: ./packages/vitest/readme.md
[repobuddy]: ./packages/buddy/readme.md
[agent skills]: https://github.com/vercel-labs/skills
[Skills CLI]: https://github.com/vercel-labs/skills
[universal plugin]: https://github.com/agentplugins/agent-plugins-spec
[`create-issue`]: ./packages/buddy/skills/create-issue/SKILL.md
[`merge-dep-prs`]: ./packages/buddy/skills/merge-dep-prs/SKILL.md
[`setup-github-pages`]: ./packages/buddy/skills/setup-github-pages/SKILL.md
[`setup-github-repo`]: ./packages/buddy/skills/setup-github-repo/SKILL.md
[`repobuddy/agent-changesets`]: https://github.com/repobuddy/agent-changesets
[`repobuddy/agent-security`]: https://github.com/repobuddy/agent-security
[biome]: https://biomejs.dev/
[codecov-biome-image]: https://codecov.io/gh/repobuddy/repobuddy/badge.svg?flag=biome
[codecov-biome-url]: https://codecov.io/gh/repobuddy/repobuddy
[codecov-jest-image]: https://codecov.io/gh/repobuddy/repobuddy/badge.svg?flag=jest
[codecov-jest-url]: https://codecov.io/gh/repobuddy/repobuddy
[codecov-ts-image]: https://codecov.io/gh/repobuddy/repobuddy/badge.svg?flag=typescript
[codecov-ts-url]: https://codecov.io/gh/repobuddy/repobuddy
[downloads-biome-image]: https://img.shields.io/npm/dm/@repobuddy/biome.svg?style=flat
[downloads-cli-image]: https://img.shields.io/npm/dm/repobuddy.svg?style=flat
[downloads-jest-image]: https://img.shields.io/npm/dm/@repobuddy/jest.svg?style=flat
[downloads-test-image]: https://img.shields.io/npm/dm/@repobuddy/test.svg?style=flat
[downloads-ts-image]: https://img.shields.io/npm/dm/@repobuddy/typescript.svg?style=flat
[downloads-vitest-image]: https://img.shields.io/npm/dm/@repobuddy/vitest.svg?style=flat
[github-action-url]: https://github.com/repobuddy/repobuddy/actions/workflows/release.yml
[github-nodejs]: https://github.com/repobuddy/repobuddy/actions/workflows/release.yml/badge.svg
[jest]: https://jestjs.io/
[npm-biome-image]: https://img.shields.io/npm/v/@repobuddy/biome.svg?style=flat
[npm-biome-url]: https://npmjs.org/package/@repobuddy/biome
[npm-cli-image]: https://img.shields.io/npm/v/repobuddy.svg?style=flat
[npm-cli-url]: https://npmjs.org/package/repobuddy
[npm-jest-image]: https://img.shields.io/npm/v/@repobuddy/jest.svg?style=flat
[npm-jest-url]: https://npmjs.org/package/@repobuddy/jest
[npm-test-image]: https://img.shields.io/npm/v/@repobuddy/test.svg?style=flat
[npm-test-url]: https://npmjs.org/package/@repobuddy/test
[npm-ts-image]: https://img.shields.io/npm/v/@repobuddy/typescript.svg?style=flat
[npm-ts-url]: https://npmjs.org/package/@repobuddy/typescript
[npm-vitest-image]: https://img.shields.io/npm/v/@repobuddy/vitest.svg?style=flat
[npm-vitest-url]: https://npmjs.org/package/@repobuddy/vitest
[vitest]: https://vitest.dev/
[`repobuddy`]: https://www.npmjs.com/package/repobuddy
[typescript]: https://typescriptlang.org/
[vscode-image]: https://img.shields.io/badge/vscode-ready-green.svg
[vscode-url]: https://code.visualstudio.com/
