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

- 🚧 `buddy init`: creates a `.repobuddy.json` file in the current directory.
- 🚧 `buddy add <plugin>`: adds a `@repobuddy/<plugin>` to your project.

### Available plugins

- [@repobuddy/typescript](./packages/typescript/readme.md)

[`clibuilder`]: https://www.npmjs.com/package/clibuilder
[`repobuddy`]: https://github.com/repobuddy/repobuddy/tree/main/packages/buddy
