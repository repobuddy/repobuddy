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
- 🚧 `buddy init`: creates a `.repobuddy.json` file in the current directory.
- 🚧 `buddy add <plugin>`: adds a `@repobuddy/<plugin>` to your project.

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

### Available plugins

- [@repobuddy/typescript](./packages/typescript/readme.md)

[`clibuilder`]: https://www.npmjs.com/package/clibuilder
[`repobuddy`]: https://github.com/repobuddy/repobuddy/tree/main/packages/buddy
