# Repobuddy

[`repobuddy`] is a CLI tool to manage your repository.

It is a plugin-based CLI tool based on [`clibuilder`].

## Install

```sh
npm install -D repobuddy

yarn add -D repobuddy

pnpm add -D repobuddy
```

## Usage

As a plugin-based CLI,
each plugin will provide additional commands to the CLI.

- `buddy test-scripts`: adds or adjusts the `test`, `coverage`, and `test:watch` scripts in the
  current project's `package.json`, matching the test runner it uses.
- `buddy check-deps`: reports packages your jest config uses that your `package.json` does not declare.
- `buddy plugins list`: lists the installed `buddy` plugins.
- `buddy plugins search`: finds `buddy` plugins on npm.

Global options such as `--silent` and `--verbose` go after the command name:
`buddy test-scripts --silent`, not `buddy --silent test-scripts`.

### `buddy test-scripts`

```sh
buddy test-scripts [--cwd <dir>] [--runner jest|vitest]
```

The runner is detected from the project's dependencies — `jest` or `@repobuddy/jest` means jest,
`vitest` or `@repobuddy/vitest` means vitest — and `--runner` names it when a project depends on
both or on neither.

| Script | jest | vitest |
|---|---|---|
| `test` | `jest` | `vitest run` |
| `coverage` | `jest --coverage` | `vitest run --coverage` |
| `test:watch` | `jest --watch` | `vitest` |

A missing script is added. A script still holding one of the values in that table — for either
runner — is adjusted, so a project that moved from jest to vitest picks up the new commands and a
second run changes nothing. Any other value is one the project customized, and is left alone and
reported as skipped.

### `buddy check-deps`

A jest preset names the packages it needs, but the project using the preset is
the one that has to install them. When one is missing, jest fails somewhere
unhelpful — or worse, silently resolves it from a hoisted copy that the next
install takes away.

`check-deps` reads your jest config, follows the preset chain, and reports every
package they use that no dependency field of your `package.json` declares:

```sh
buddy check-deps
```

```
missing dependencies: 5 used by jest.config.mjs but not declared in package.json
  jest-esm-transformer-2    preset(@repobuddy/jest/presets/ts-watch) transform
  jest-watch-suspend        preset(@repobuddy/jest/presets/ts-watch) watchPlugins
  jest-watch-toggle-config  preset(@repobuddy/jest/presets/ts-watch) watchPlugins
  jest-watch-typeahead      preset(@repobuddy/jest/presets/ts-watch) watchPlugins
  ts-jest                   preset(@repobuddy/jest/presets/ts-watch) transform
install: pnpm add -D jest-esm-transformer-2 jest-watch-suspend jest-watch-toggle-config jest-watch-typeahead ts-jest
```

It exits `1` when something is missing and `0` otherwise, so it can gate a
build. Pass `--cwd` to check a project other than the current directory.

Being installed in `node_modules` is deliberately not enough: a package that
only resolves because something else pulled it in is still undeclared. The one
exception is `jest-environment-node`, which arrives with jest itself.

This is a command you run, not an install hook. The same check as a
`postinstall` script would run in every consumer's install, on a machine that
did not ask for it — intrusive, and exactly the shape a supply-chain review
flags. Run it from a `pretest` script or in CI instead.

### Available plugins

List a plugin in a `.repobuddy.json` file at the project root to add its commands:

```json
{
  "plugins": ["@repobuddy/typescript"]
}
```

- [@repobuddy/typescript](https://github.com/repobuddy/repobuddy/tree/main/packages/typescript): adds `buddy ts`

[`clibuilder`]: https://www.npmjs.com/package/clibuilder
[`repobuddy`]: https://github.com/repobuddy/repobuddy/tree/main/packages/buddy
