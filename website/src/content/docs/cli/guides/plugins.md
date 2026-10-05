---
title: Add a plugin
description: Install a buddy plugin such as @repobuddy/typescript and register it in the config file.
---

A plugin adds commands to `buddy`. Installing the package is not enough: `buddy` loads only the plugins listed under
`plugins` in its config. This guide adds `@repobuddy/typescript`, which adds `buddy ts`.

## Steps

1. Find plugins on npm (optional).

   ```sh
   pnpm exec buddy plugins search
   ```

   The search matches the `repobuddy` keyword, so some results are not plugins. A plugin exports an `activate`
   function.

2. Install `repobuddy` and the plugin in the project.

   ```sh
   pnpm add -D repobuddy @repobuddy/typescript
   ```

3. Create `.repobuddy.json` in the project root.

   ```json
   {
   	"plugins": ["@repobuddy/typescript"]
   }
   ```

   Or add a `repobuddy` key to `package.json`:

   ```json
   {
   	"repobuddy": {
   		"plugins": ["@repobuddy/typescript"]
   	}
   }
   ```

   See [Config file](/repobuddy/cli/#config-file) for every file name `buddy` reads.

4. Run `buddy` from the project directory or below it. `buddy` resolves each plugin from the current directory.

## Verify

1. Print the loaded config.

   ```sh
   pnpm exec buddy --show-config
   ```

   ```
   config: /home/me/my-app/.repobuddy.json
   {
     "plugins": [
       "@repobuddy/typescript"
     ]
   }
   ```

2. Check that the command list includes `ts`.

   ```sh
   pnpm exec buddy --help
   ```

   ```
   Commands:
     plugins, test-scripts, check-deps (check-dependencies), ts
   ```

3. Check the plugin's commands.

   ```sh
   pnpm exec buddy ts --help
   ```

   ```
   Usage: repobuddy ts <command>

   Commands:
     build, copy-cjs-package-json (cpj)
   ```

## Troubleshooting

A plugin that is listed but not installed prints warnings, and its commands are missing:

```
Unable to load plugin from not-installed-plugin. Please let the plugin author knows about it.
cwd: /home/me/my-app
error:  Cannot find package 'not-installed-plugin' imported from .../repobuddy/esm/bin.js
not a valid plugin not-installed-plugin
```

Install the package, or remove it from `plugins`. The same `not a valid plugin` warning appears for a package that
does not export `activate`.

## Related

- [`buddy plugins list`](/repobuddy/cli/plugins-list/)
- [`buddy plugins search`](/repobuddy/cli/plugins-search/)
- [`@repobuddy/typescript`](/repobuddy/typescript/)
