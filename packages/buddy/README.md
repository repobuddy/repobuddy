# repobuddy

[repobuddy] is a CLI tools to manage your repository.

It is a plugin-based CLI tool based on [clibuilder](https://www.npmjs.com/package/clibuilder).

## Install

```sh
npm install -D repobuddy

yarn add -D repobuddy

pnpm add -D repobuddy
```

## Usage

As a plugin-based CLI,
each plugin will provide additional commands to the CLI.

- 🚧 `repobuddy init`: creates a `.repobuddy.json` file in the current directory.
- 🚧 `repobuddy add <plugin>`: adds a `@repobuddy/<plugin>` to your project.

### Available plugins

- [@repobuddy/typescript](./packages/typescript/README.md)
