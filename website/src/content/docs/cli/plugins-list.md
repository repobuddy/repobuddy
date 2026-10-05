---
title: buddy plugins list
description: List the installed packages that carry the repobuddy keyword.
---

`buddy plugins list` lists the packages in `node_modules` whose `package.json` `keywords` include `repobuddy`.

## Usage

```sh
buddy plugins list [--format toon|text|json]
```

Alias: `buddy plugins ls`.

## Options

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `--format` | `toon` \| `text` \| `json` | `toon` | `toon` is compact output for agents. `text` is a sentence for people. `json` is for a pipe. |

The [global options](/repobuddy/cli/global-options/) also apply.

## Behavior

- It scans the `node_modules` folder of the current directory, including nested `node_modules` folders. It skips
  `@types`.
- It matches the keyword only. It does not check the config file, and it does not check that the package exports an
  `activate` function. A listed package adds commands only after you add it to `plugins` in the
  [config file](/repobuddy/cli/#config-file).
- It reports only installed packages. To find packages on npm, run
  [`buddy plugins search`](/repobuddy/cli/plugins-search/).
- `buddy plugins` with no subcommand prints the group's help and exits `2`.

## Output

`toon`:

```
plugins[1]: @repobuddy/typescript
help[1]: Run `plugins search` to find more plugins on npm
```

`text`:

```
found one plugin: @repobuddy/typescript
```

`json`:

```json
{
  "plugins": [
    "@repobuddy/typescript"
  ]
}
```

None installed, `toon`:

```
plugins: 0 installed plugins found with keywords: repobuddy
help[1]: Run `plugins search` to find plugins to install
```

None installed, `text`:

```
no plugin with keywords: repobuddy
```

## Exit codes

| Code | When |
| --- | --- |
| `0` | The list printed, including an empty list. |
| `2` | An unknown option, or a `--format` value outside the three. |

## Examples

```sh
buddy plugins list
buddy plugins ls --format json
```

## Related

- [`buddy plugins search`](/repobuddy/cli/plugins-search/)
- [Add a plugin](/repobuddy/cli/guides/plugins/)
