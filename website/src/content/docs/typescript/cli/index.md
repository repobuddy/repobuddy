---
title: CLI plugin
description: How @repobuddy/typescript adds the ts command group to the buddy CLI.
---

`@repobuddy/typescript` is a plugin for the [`buddy` CLI](/repobuddy/cli/) from the `repobuddy` package. Once the
plugin is listed in the repobuddy config, `buddy ts` gains two commands. The commands are in beta.

| Command | Purpose |
| --- | --- |
| [`buddy ts build <type>`](/repobuddy/typescript/cli/build/) | Run `tsc -p tsconfig.<type>.json`, then mark `cjs` and `tslib` output as CommonJS |
| [`buddy ts copy-cjs-package-json <dir> [cwd]`](/repobuddy/typescript/cli/copy-cjs-package-json/) | Copy [`package.cjs.json`](/repobuddy/typescript/nodejs-package-cjs-json/) into `<cwd>/<dir>/package.json`. Alias: `cpj` |

## Enable the plugin

1. Install both packages:

   ```sh
   pnpm add -D repobuddy @repobuddy/typescript
   ```

2. List the plugin in a `.repobuddy.json` file at the project root:

   ```json
   {
   	"plugins": ["@repobuddy/typescript"]
   }
   ```

   Or add a `repobuddy` property to `package.json`:

   ```json
   {
   	"repobuddy": {
   		"plugins": ["@repobuddy/typescript"]
   	}
   }
   ```

3. Check that the commands load:

   ```sh
   pnpm exec buddy ts --help
   ```

   ```
   Usage: repobuddy ts <command>

   Commands:
     build, copy-cjs-package-json (cpj)
   ```

## How the plugin loads

- The package's only JavaScript export is an `activate(cli)` function. It registers one command group, `ts`, that holds
  `build` and `copy-cjs-package-json`.
- The `buddy` CLI reads the `repobuddy` config through `clibuilder`. It searches from the current directory up to the
  filesystem root for a config file (such as `.repobuddy.json`, `repobuddy.json`, `.repobuddyrc`, `.repobuddy.yml`, or
  `.repobuddy.js`). If none exists, it uses the `repobuddy` property of the nearest `package.json`.
- For each name in `plugins`, the CLI resolves the module from the current directory and imports it. The package must
  be installed in the project you run `buddy` from.
- `buddy --show-config` prints which config the CLI found and its content.

## Errors

- If the plugin cannot be resolved, `buddy` prints `Unable to load plugin from @repobuddy/typescript` and
  `not a valid plugin @repobuddy/typescript`, then runs without the `ts` commands.
- If no config lists the plugin, `buddy ts` does not exist.

## Related

- [`buddy ts build`](/repobuddy/typescript/cli/build/)
- [`buddy ts copy-cjs-package-json`](/repobuddy/typescript/cli/copy-cjs-package-json/)
- [`repobuddy` CLI](/repobuddy/cli/)
