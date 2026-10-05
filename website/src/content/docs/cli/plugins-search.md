---
title: buddy plugins search
description: Search the npm registry for packages that carry the repobuddy keyword.
---

`buddy plugins search` searches the npm registry for packages whose keywords include `repobuddy`.

## Usage

```sh
buddy plugins search [--format toon|text|json] [--fields keywords]
```

## Options

| Option | Type | Default | Effect |
| --- | --- | --- | --- |
| `--format` | `toon` \| `text` \| `json` | `toon` | `toon` is compact output for agents. `text` is a sentence for people. `json` is for a pipe. |
| `--fields` | string, comma separated | none | Extra fields to report. `keywords` is the only one. `name` is accepted and changes nothing. |

The [global options](/repobuddy/cli/global-options/) also apply.

## Behavior

- It queries `https://registry.npmjs.org`, so it needs network access.
- It matches the keyword only. Some results are presets or libraries, not `buddy` plugins. A package is a plugin
  when it exports an `activate` function; `buddy` warns `not a valid plugin` when you register one that does not.
- Any other `--fields` value prints an error line and a hint, and exits `0`.

## Output

With `--fields keywords`, `toon` (a real run on 2026-10-04):

```
packages[7]{name,keywords}:
  @repobuddy/test,repobuddy
  @repobuddy/biome,repobuddy
  @repobuddy/typescript,repobuddy
  buddy-agent-harness,repobuddy
  @repobuddy/vitest,repobuddy
  buddy-codecov,repobuddy
  @repobuddy/rolldown-inline-type-exports,repobuddy
help[1]: Run `plugins list` to see which of them are installed
```

Without `--fields`, `toon` prints one line, `packages[<n>]: <name>,<name>,...`, followed by the same `help` line.

With `--format json`, the payload is `{ "packages": [...] }`: names only, or `{ name, keywords }` objects with
`--fields keywords`.

No match:

```
packages: 0 packages found with keywords: repobuddy
```

An unknown field:

```sh
buddy plugins search --fields version
```

```
error: unknown value for --fields: version
help[1]: The only extra field is `keywords`. Run `plugins search --fields keywords`
```

## Exit codes

| Code | When |
| --- | --- |
| `0` | The search ran, including an unknown `--fields` value. |
| `2` | An unknown option, or a `--format` value outside the three. |

## Related

- [`buddy plugins list`](/repobuddy/cli/plugins-list/)
- [Add a plugin](/repobuddy/cli/guides/plugins/)
