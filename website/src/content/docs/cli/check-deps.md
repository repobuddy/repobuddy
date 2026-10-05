---
title: buddy check-deps
description: Report packages a Jest config and its preset chain use that package.json does not declare.
---

`buddy check-deps` reports every package the project's Jest config uses, through its whole preset chain, that no
dependency field of `package.json` declares.

## Usage

```sh
buddy check-deps [--cwd <dir>]
```

Alias: `buddy check-dependencies`.

## Options

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `--cwd` | string | the current directory | The project to check. It must hold a `package.json`. |

The [global options](/repobuddy/cli/global-options/) also apply.

## How it works

1. It finds the Jest config. It tries `jest.config.js`, `jest.config.mjs`, `jest.config.cjs`, `jest.config.ts`,
   `jest.config.mts`, `jest.config.cts`, and `jest.config.json`, in that order. When none exists, it uses the `jest`
   key of `package.json`. A module config may export an object or a function, sync or async.
2. It lists the packages that config names, with the field that names each one (`transform`, `watchPlugins`,
   `preset`, and so on).
3. It follows `preset`. It resolves the preset from the project directory as the module itself, then as
   `<preset>/jest-preset.js`, then as `<preset>/jest-preset.json`. It repeats for that preset's own `preset`, up to 10
   levels, and stops on a loop.
4. It compares the list with `dependencies`, `devDependencies`, `peerDependencies`, and `optionalDependencies`.

Rules:

- A package found in `node_modules` but not declared still counts as missing. The next install can remove it.
- `jest-environment-node` is never reported. It arrives with Jest.
- The project's own package name is never reported.
- A preset that does not load gives the warning `could not load preset "<name>"`. The preset package itself is then
  reported as missing.
- The install line follows the `packageManager` field of `package.json`, searched in the project directory and then
  in each parent directory: `pnpm add -D`, `yarn add -D`, `bun add -d`, or `npm i -D` when none is set.

The packages a preset needs can depend on what is already installed. For example,
`@repobuddy/jest/presets/ts` reported `jest-esm-transformer-2` and `ts-jest` in one project and `@swc/jest` after
those two were declared. Run the command again after you install.

## Output

All declared:

```
dependencies: 3 used by jest.config.mjs, all declared in package.json
```

No Jest config:

```
dependencies: no jest configuration found, nothing to check
```

Missing packages (a project with `"packageManager": "pnpm@10.0.0"` and only `@repobuddy/jest` and `jest`
declared):

```
missing dependencies: 5 used by jest.config.mjs but not declared in package.json
  jest-esm-transformer-2    preset(@repobuddy/jest/presets/ts-watch) transform
  jest-watch-suspend        preset(@repobuddy/jest/presets/ts-watch) watchPlugins
  jest-watch-toggle-config  preset(@repobuddy/jest/presets/ts-watch) watchPlugins
  jest-watch-typeahead      preset(@repobuddy/jest/presets/ts-watch) watchPlugins
  ts-jest                   preset(@repobuddy/jest/presets/ts-watch) transform
install: pnpm add -D jest-esm-transformer-2 jest-watch-suspend jest-watch-toggle-config jest-watch-typeahead ts-jest
```

Each detail line names the package, then where it came from: the config file or `preset(<name>)`, and the field.
When the config lives in `package.json`, the summary says `used by package.json#jest`.

## Exit codes

| Code | When |
| --- | --- |
| `0` | Every package is declared, or the project has no Jest config. |
| `1` | At least one package is missing, or the directory has no readable `package.json`. |
| `2` | An unknown option. |

## Examples

### Check the current project

```sh
buddy check-deps
```

### Check a workspace package from the repository root

```sh
buddy check-deps --cwd packages/app
```

### A preset that does not resolve

`jest.config.cjs`:

```js
module.exports = { preset: 'no-such-preset' }
```

```
could not load preset "no-such-preset"
missing dependencies: 1 used by jest.config.cjs but not declared in package.json
  no-such-preset  jest.config.cjs preset
install: npm i -D no-such-preset
```

### A directory that is not a project

```sh
buddy check-deps --cwd does-not-exist
```

```
cannot read the project at does-not-exist
check-deps needs a directory with a package.json
```

## Related

- [Check Jest dependencies in CI](/repobuddy/cli/guides/check-deps-in-ci/)
- [`@repobuddy/jest`](/repobuddy/jest/): the presets this command follows.
