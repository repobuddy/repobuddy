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

- `buddy check-deps`: reports packages your jest config uses that your `package.json` does not declare.
- 🚧 `buddy init`: creates a `.repobuddy.json` file in the current directory.
- 🚧 `buddy add <plugin>`: adds a `@repobuddy/<plugin>` to your project.

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
missing dependencies: 2 used by jest.config.mjs but not declared in package.json
  jest-watch-suspend    preset(@repobuddy/jest/presets/ts-watch) watchPlugins
  jest-watch-typeahead  preset(@repobuddy/jest/presets/ts-watch) watchPlugins
install: pnpm add -D jest-watch-suspend jest-watch-typeahead
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

- [@repobuddy/typescript](./packages/typescript/readme.md)

[`clibuilder`]: https://www.npmjs.com/package/clibuilder
[`repobuddy`]: https://github.com/repobuddy/repobuddy/tree/main/packages/buddy
