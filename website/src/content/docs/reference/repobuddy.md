---
title: repobuddy
description: The buddy CLI for repository chores, and the agent plugin that ships repobuddy's skills to Claude Code, Cursor, Codex, and Copilot CLI.
---

The `repobuddy` package does two jobs. It is the `buddy` command-line tool, and it is an agent plugin that carries
the [repobuddy skills](/repobuddy/reference/packages/#agent-skills) to coding agents.

## Install

```sh
# npm
npm install -D repobuddy

# yarn
yarn add -D repobuddy

# pnpm
pnpm add -D repobuddy
```

The package installs three names for the same program: `buddy`, `bd`, and `repobuddy`. It has no runtime
dependencies and no importable API.

## CLI

```sh
buddy --help
```

| Command | What it does |
| --- | --- |
| [`buddy test-scripts`](#buddy-test-scripts) | Adds or adjusts the `test`, `coverage`, and `test:watch` scripts for the project's test runner |
| [`buddy check-deps`](#buddy-check-deps) | Reports packages the Jest config uses that `package.json` does not declare |
| [`buddy plugins`](#buddy-plugins) | Lists installed CLI plugins, or searches npm for them |

Every command accepts the global options `--help`, `--version`, `--verbose`, `--silent`, `--debug-cli`, and
`--show-config`.

### `buddy test-scripts`

```sh
buddy test-scripts [--cwd <dir>] [--runner jest|vitest]
```

The runner comes from the project's dependencies. `jest` or `@repobuddy/jest` means Jest. `vitest` or
`@repobuddy/vitest` means Vitest. Pass `--runner` when the project depends on both or on neither.

| Script | Jest | Vitest |
| --- | --- | --- |
| `test` | `jest` | `vitest run` |
| `coverage` | `jest --coverage` | `vitest run --coverage` |
| `test:watch` | `jest --watch` | `vitest` |

A missing script is added. A script that holds a value from this table, for either runner, is adjusted to the chosen
runner. Any other value is a customization: the command leaves it alone and reports it as skipped. A second run
changes nothing.

`--cwd` points at a project other than the current directory. The command keeps the file's indentation and trailing
newline.

### `buddy check-deps`

```sh
buddy check-deps [--cwd <dir>]
```

Alias: `check-dependencies`.

A Jest preset names packages that the project using it has to install. `check-deps` reads
`jest.config.{js,mjs,cjs,ts,mts,cts,json}`, follows the `preset` chain, and lists every package the config uses that
no dependency field of `package.json` declares:

```
missing dependencies: 2 used by jest.config.mjs but not declared in package.json
  jest-watch-suspend    preset(@repobuddy/jest/presets/ts-watch) watchPlugins
  jest-watch-typeahead  preset(@repobuddy/jest/presets/ts-watch) watchPlugins
install: pnpm add -D jest-watch-suspend jest-watch-typeahead
```

- It exits `1` when a package is missing and `0` otherwise. A project with no Jest config exits `0`.
- The install line matches the `packageManager` field: `pnpm add -D`, `yarn add -D`, `bun add -d`, or `npm i -D`.
- A package present in `node_modules` but not declared still counts as missing. `jest-environment-node` is the one
  exception, because it arrives with Jest.

Run it from a `pretest` script or in CI. It is not an install hook.

### `buddy plugins`

| Command | What it does |
| --- | --- |
| `buddy plugins list` (alias `ls`) | Lists installed packages that are `buddy` plugins |
| `buddy plugins search` | Searches the npm registry for `buddy` plugins. `--fields keywords` adds the matching keywords. |

Both take `--format toon|text|json`. The default is `toon`.

A plugin adds commands to `buddy`. Installing it is not enough: list it under `plugins` in the CLI's config, such
as `.repobuddy.json` or a `repobuddy` key in `package.json`:

```json
// .repobuddy.json
{
	"plugins": ["@repobuddy/typescript"]
}
```

[`@repobuddy/typescript`](/repobuddy/reference/typescript/#buddy-cli-plugin) is the available plugin. It adds
`buddy ts build` and `buddy ts copy-cjs-package-json`.

### Skill script commands

Some skills run a script for the deterministic part of their work. The same scripts are available as `buddy`
subcommands, so a skill installed without its scripts can run them through `npx -y repobuddy@<version>`. They take
raw arguments and do not appear in `buddy --help`.

| Command | Used by | What it does |
| --- | --- | --- |
| `buddy env` | `init-buddy` | Reports the OS, package managers, git hosts and their CLIs, and configured MCP servers |
| `buddy detect-state` | `setup-github-repo` | Records the repository's GitHub settings and files to a state file |
| `buddy scaffold-workflows` | `setup-github-repo` | Writes the CI workflows the state file says are missing |
| `buddy npm-trust plan\|apply` | `setup-npm-trusted-publishing` | Plans and registers npm trusted publishers |
| `buddy release-age status\|lift\|restore\|open-pr` | `min-release-age` | Lifts and restores the minimum-release-age gate for one package version |
| `buddy agent-readiness score\|bench` | `agent-readiness` | Scores a repository's agent readiness, or benchmarks agent cost |

`release-age`, `npm-trust`, and `agent-readiness` print their usage when run without a subcommand.

## Agent plugin

The package is a [universal plugin](https://github.com/agentplugins/agent-plugins-spec) for Claude Code, Cursor, Codex, and
GitHub Copilot CLI. It carries every skill in the [skills table](/repobuddy/reference/packages/#agent-skills), and the
built skill scripts that only the npm package contains.

### Skills CLI

```sh
# list the skills
npx skills add repobuddy/repobuddy --list

# install all of them
npx skills add repobuddy/repobuddy

# install some of them
npx skills add repobuddy/repobuddy --skill create-issue --skill setup-github-repo
```

Skills installed this way come from git, without the built scripts. They run the script commands through
`npx -y repobuddy@<version>` instead, which needs network access.

To install from npm, so the built scripts come along:

```sh
npm install repobuddy
npx skills experimental_sync
```

### Plugin marketplace

The repository is a plugin marketplace. Claude Code and Codex install the plugin from the `repobuddy` npm package,
with the built scripts. Copilot CLI installs it from the repository and runs scripts through `npx`.

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

**Cursor** has no command-line install. A workspace admin imports the catalog from
Dashboard → Plugins → Team Marketplaces → Add Marketplace → Import from Repo.

Start a new agent session after you install.

## Related

- [Agent skills](/repobuddy/reference/packages/#agent-skills): what each skill does.
- [`@repobuddy/typescript`](/repobuddy/reference/typescript/): the `buddy ts` plugin.
- [`@repobuddy/jest`](/repobuddy/reference/jest/): the presets `check-deps` follows.
