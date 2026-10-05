---
title: Adopt Biome with @repobuddy/biome
description: Add Biome and a @repobuddy/biome config to a project, run biome check, and fix what it reports.
---

Add Biome to a project, extend a preset, and fix the first run's findings.

## Steps

1. Install both packages.

   ```sh
   # pnpm (use npm install -D or yarn add -D for the others)
   pnpm add -D @biomejs/biome @repobuddy/biome
   ```

   The package needs `@biomejs/biome >= 2`.

2. Create `biome.json` and extend a preset. See [Choose a config](/repobuddy/biome/#choose-a-config).

   ```jsonc
   // biome.json
   {
   	"$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
   	"extends": ["@repobuddy/biome"],
   	"vcs": {
   		"enabled": true,
   		"clientKind": "git",
   		"useIgnoreFile": true
   	}
   }
   ```

   `vcs` makes Biome skip files that `.gitignore` ignores. It is optional.

3. Add scripts to `package.json`.

   ```json
   {
   	"scripts": {
   		"check": "biome check",
   		"check:fix": "biome check --write",
   		"format": "biome format --write"
   	}
   }
   ```

4. Run the check.

   ```sh
   pnpm check
   ```

   Biome lints, checks formatting, and checks import order in one pass. It exits `1` when any error remains.

5. Apply the safe fixes.

   ```sh
   pnpm check:fix
   ```

6. Fix what remains by hand, or suppress one case with a comment.

   ```ts
   // biome-ignore lint/suspicious/noConsole: CLI output
   console.log('done')
   ```

## What to expect on the first run

With `recommended`:

- Formatting differences in many files: tabs, single quotes, no semicolons, line width 120. `--write` fixes them.
- Unsorted imports, from the `organizeImports` assist. `--write` fixes them.
- Unused imports, which the config marks `error` with a safe fix. `--write` removes them.
- `import 'fs'` rewritten to `import 'node:fs'` (`useNodejsImportProtocol`).
- `console.log` calls (`noConsole`). Replace them with `console.info` or another allowed method.
- Unused variables and parameters. `noUnusedVariables` is an `error`; Biome's unsafe fix prefixes the name with an
  underscore, so review the change.

With `performant`, expect the same formatting differences (with trailing commas removed), but no import sorting, no
`console.log` findings, and unused imports as warnings.

To fail on warnings too (for CI), add `--error-on-warnings`:

```sh
biome check --error-on-warnings
```

## Finished config

```jsonc
// biome.json
{
	"$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
	"extends": ["@repobuddy/biome"],
	"vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true }
}
```

## Verify

Run `pnpm check`. It reports `Checked N files` and exits `0` once the findings are fixed.

## Related

- [recommended](/repobuddy/biome/configs/recommended/) and [performant](/repobuddy/biome/configs/performant/)
- [Override a rule or formatter setting](/repobuddy/biome/guides/override-rules/)
