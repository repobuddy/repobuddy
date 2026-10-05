---
title: Override a rule or formatter setting
description: Change a rule level, a rule option, or a formatter setting that a @repobuddy/biome config sets.
---

Settings in your own `biome.json` win over the ones in the config you extend. This guide shows each kind of change.
Each example was run with Biome 2.5.15.

## Steps

1. Extend the preset first, then add your own keys below it.

   ```jsonc
   // biome.json
   {
   	"extends": ["@repobuddy/biome"]
   }
   ```

2. Change a formatter setting. Name the key the preset sets.

   ```jsonc
   {
   	"extends": ["@repobuddy/biome"],
   	"formatter": { "indentStyle": "space", "indentWidth": 2 },
   	"javascript": { "formatter": { "semicolons": "always" } }
   }
   ```

   With this config, `biome format` rewrites tab-indented code to two spaces.

3. Change a rule level.

   ```jsonc
   {
   	"extends": ["@repobuddy/biome"],
   	"linter": { "rules": { "suspicious": { "noExplicitAny": "warn" } } }
   }
   ```

   `noExplicitAny` is `off` in both presets. This sets it to `warn`.

4. Change a rule only for some files, with `overrides`.

   ```jsonc
   {
   	"extends": ["@repobuddy/biome"],
   	"overrides": [
   		{
   			"includes": ["scripts/**"],
   			"linter": { "rules": { "suspicious": { "noConsole": "off" } } }
   		}
   	]
   }
   ```

   `console.log` is still an error in `src/`, and allowed in `scripts/`.

5. Change a rule's options. State the whole option, because an option you set replaces the preset's value.

   ```jsonc
   {
   	"extends": ["@repobuddy/biome"],
   	"linter": {
   		"rules": {
   			"suspicious": {
   				"noConsole": { "level": "error", "options": { "allow": ["log", "info"] } }
   			}
   		}
   	}
   }
   ```

   With this config, `console.log` is allowed and `console.warn` is an error. The preset's `allow` list of
   `info`, `warn`, `error`, and others is gone.

## Extending order

`extends` is an array, and later entries win over earlier ones. Your own keys, written in the same file, win over
everything in `extends`.

```jsonc
{
	"extends": ["@repobuddy/biome", "./team.json"]
}
```

With `./team.json` last, its settings override the preset's. Swapping the order makes the preset override `./team.json`.
Verified with `suspicious/noConsole`: with the preset last, the preset's `allow` list applied.

See the [Biome configuration reference](https://biomejs.dev/reference/configuration/) for the full merge rules.

## Verify

Run `biome check` and confirm the finding you changed appears, or stops appearing, at the level you set. 


## Related

- [recommended](/repobuddy/biome/configs/recommended/) and [performant](/repobuddy/biome/configs/performant/): the settings you override
- [recommended vs performant](/repobuddy/biome/configs/compare/)
