---
title: buddy CLI
description: The buddy command-line tool from the repobuddy package, its commands, config file, and what it supports.
---

`buddy` is the command-line tool in the `repobuddy` package. It writes test scripts into `package.json`, checks that
a Jest config's packages are declared, and loads plugins that add more commands.

The same package is also an agent plugin that ships the repobuddy skills. See
[Install the skills](/repobuddy/skills/install/) for that half.

## Install

```sh
# npm
npm install -D repobuddy

# yarn
yarn add -D repobuddy

# pnpm
pnpm add -D repobuddy
```

The package installs three names for the same program: `buddy`, `bd`, and `repobuddy`. All three run
`bin/buddy.js`. The package has no runtime dependencies and no importable API: its `exports` field names only
`./package.json`.

```sh
buddy --help
```

```
Usage: repobuddy <command> [options]

  Your repo buddy

Commands:
  plugins, test-scripts, check-deps (check-dependencies)

  <command> -h           Get help for <command>

Options:
  [-h|--help]            Print help message
  [-v|--version]         Print the CLI version
  [-V|--verbose]         Turn on verbose logging
  [--silent]             Turn off logging
  [--debug-cli]          Display clibuilder debug messages
  [--show-config]        Print the resolved config and where it was loaded from
```

The help text names the program `repobuddy` whichever bin name you run.

## Choose a command

| You want to | Command |
| --- | --- |
| Add or update the `test`, `coverage`, and `test:watch` scripts | [`buddy test-scripts`](/repobuddy/cli/test-scripts/) |
| Find packages your Jest config uses that `package.json` does not declare | [`buddy check-deps`](/repobuddy/cli/check-deps/) |
| See which `buddy` plugins are installed | [`buddy plugins list`](/repobuddy/cli/plugins-list/) |
| Find `buddy` plugins on npm | [`buddy plugins search`](/repobuddy/cli/plugins-search/) |
| Change logging, print the version, or print the loaded config | [Global options](/repobuddy/cli/global-options/) |
| Run a skill's script without the skill's bundled copy | [Skill script commands](/repobuddy/cli/skill-scripts/) |

A plugin adds its own commands. For example, `@repobuddy/typescript` adds `buddy ts`. See
[Add a plugin](/repobuddy/cli/guides/plugins/).

## Exit codes

Every command uses the same three codes.

| Code | Meaning |
| --- | --- |
| `0` | The command did what was asked, including a run that changed nothing. |
| `1` | The command was called correctly but failed, for example `check-deps` found a missing package. |
| `2` | The command was called wrong: an unknown command or option, or an option value outside its allowed set. `buddy` prints the error and the command's help. |

The [skill script commands](/repobuddy/cli/skill-scripts/) set their own codes. Each page lists them.

## Config file

`buddy` reads one config value: `plugins`, the list of plugin packages to load.

```json
{
	"plugins": ["@repobuddy/typescript"]
}
```

`buddy` looks for a config file in the current directory, then in each parent directory up to the file system root.
The nearest directory with a match wins. In each directory it tries these names, in order:

```
repobuddy .repobuddy repobuddy.cjs .repobuddy.cjs repobuddy.mjs .repobuddy.mjs repobuddy.js .repobuddy.js
repobuddy.json .repobuddy.json repobuddy.jsonc .repobuddy.jsonc repobuddy.yml .repobuddy.yml
repobuddy.yaml .repobuddy.yaml repobuddyrc.cjs .repobuddyrc.cjs repobuddyrc.mjs .repobuddyrc.mjs
repobuddyrc.js .repobuddyrc.js repobuddyrc.json .repobuddyrc.json repobuddyrc.jsonc .repobuddyrc.jsonc
repobuddyrc.yml .repobuddyrc.yml repobuddyrc.yaml .repobuddyrc.yaml repobuddyrc .repobuddyrc
```

- `.json` and `.jsonc` files may hold comments and trailing commas.
- `.yml` and `.yaml` files are YAML.
- `.js`, `.cjs`, and `.mjs` files are imported. `buddy` uses the default export.
- A name with no extension is read as JSON first, then as YAML.

When no file matches, `buddy` uses the `repobuddy` key of the nearest `package.json`:

```json
{
	"name": "my-app",
	"repobuddy": {
		"plugins": ["@repobuddy/typescript"]
	}
}
```

No config at all is a normal state. Every built-in command runs without one. Run `buddy --show-config` to see
which file was loaded. See [Global options](/repobuddy/cli/global-options/#--show-config).

## Support

| Area | Supported |
| --- | --- |
| Node.js | No `engines` field is declared. The bin is an ES module that uses top-level `await`, so it needs a Node.js version with both. |
| Module format | ESM only (`"type": "module"`). There is no library API to import. |
| Package managers named by `check-deps` | pnpm, Yarn, bun, and npm, read from the `packageManager` field of `package.json` (searched upward). npm is the fallback. |
| Test runners for `test-scripts` | Jest and Vitest, detected from `jest`, `@repobuddy/jest`, `vitest`, or `@repobuddy/vitest` in `dependencies` or `devDependencies`. |
| Jest config formats for `check-deps` | `jest.config.js`, `.mjs`, `.cjs`, `.ts`, `.mts`, `.cts`, `.json`, and the `jest` key of `package.json`. A config may export an object or a function (sync or async). |
| TypeScript Jest configs | Loaded with Node's own `import()`, so Node must be able to run the `.ts` file itself. Verified on Node 24. |
| Config file | JSON, JSONC, YAML, and JS modules. See [Config file](#config-file). |
| Monorepos | Each command acts on one `package.json`. Point at a workspace package with `--cwd`. `check-deps` finds `packageManager` in a parent directory. |

### Not supported

- `check-deps` does not read Vitest configs. It checks Jest configs only.
- `check-deps` does not install anything. It prints the install command for you to run.
- `test-scripts` manages only `test`, `coverage`, and `test:watch`. It does not install the test runner.
- `test-scripts` does not read `peerDependencies` or `optionalDependencies` when it detects the runner.
- Neither command walks the packages of a workspace. Run it once per package.
- The config file has no keys besides `plugins`. The built-in commands take no settings from it.
- The README lists `buddy init` and `buddy add` as planned. Neither command exists.

## Guides

- [Set up test scripts](/repobuddy/cli/guides/test-scripts/)
- [Check Jest dependencies in CI](/repobuddy/cli/guides/check-deps-in-ci/)
- [Add a plugin](/repobuddy/cli/guides/plugins/)
