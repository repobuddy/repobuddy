# Your repository buddy

[![GitHub NodeJS][github-nodejs]][github-action-url]
[![Visual Studio Code][vscode-image]][vscode-url]

[`repobuddy`] helps you to manage your repository.

## Agent Skills

`repobuddy` provides [agent skills] for AI coding assistants (Claude Code, Cursor, etc.) to help manage your repository. Skills live in [`skills/`](./skills/) and are installed with the [Skills CLI].

### Available Skills

| Skill | Description |
| --- | --- |
| [`create-issue`] | Create a bug report or feature request — searches for duplicates first |
| [`merge-dep-prs`] | Merge pending dependency update PRs — diagnoses CI failures, never merges release PRs |
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

## [@repobuddy/typescript]

[![NPM version][npm-ts-image]][npm-ts-url] [![NPM downloads][downloads-ts-image]][npm-ts-url] [![Codecov][codecov-ts-image]][codecov-ts-url]

> Provides tools and utilities to take care of [TypeScript] stuffs, so you don't have to.

[@repobuddy/biome]: ./packages/biome/readme.md
[@repobuddy/jest]: ./packages/jest/readme.md
[@repobuddy/typescript]: ./packages/typescript/readme.md
[agent skills]: https://github.com/vercel-labs/skills
[Skills CLI]: https://github.com/vercel-labs/skills
[`create-issue`]: ./skills/create-issue/SKILL.md
[`merge-dep-prs`]: ./skills/merge-dep-prs/SKILL.md
[`setup-github-repo`]: ./skills/setup-github-repo/SKILL.md
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
[downloads-jest-image]: https://img.shields.io/npm/dm/@repobuddy/jest.svg?style=flat
[downloads-ts-image]: https://img.shields.io/npm/dm/@repobuddy/typescript.svg?style=flat
[github-action-url]: https://github.com/repobuddy/jest/actions/workflows/release.yml
[github-nodejs]: https://github.com/repobuddy/jest/actions/workflows/release.yml/badge.svg
[jest]: https://jestjs.io/
[npm-biome-image]: https://img.shields.io/npm/v/@repobuddy/biome.svg?style=flat
[npm-biome-url]: https://npmjs.org/package/@repobuddy/biome
[npm-jest-image]: https://img.shields.io/npm/v/@repobuddy/jest.svg?style=flat
[npm-jest-url]: https://npmjs.org/package/@repobuddy/jest
[npm-ts-image]: https://img.shields.io/npm/v/@repobuddy/typescript.svg?style=flat
[npm-ts-url]: https://npmjs.org/package/@repobuddy/typescript
[`repobuddy`]: https://www.npmjs.com/package/repobuddy
[typescript]: https://typescriptlang.org/
[vscode-image]: https://img.shields.io/badge/vscode-ready-green.svg
[vscode-url]: https://code.visualstudio.com/
