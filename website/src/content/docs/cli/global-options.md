---
title: Global options
description: The options every buddy command accepts, for help, version, logging, and the loaded config.
---

Every `buddy` command accepts these options. Put them after the command name. `buddy --help test-scripts` prints the
top-level help, not the help for `test-scripts`. `buddy --silent test-scripts` exits `2` without running the
command.

## Options

| Option | Alias | Type | Default | Effect |
| --- | --- | --- | --- | --- |
| `--help` | `-h` | boolean | off | Prints help for the command and exits `0`. Checked before any other error. |
| `--version` | `-v` | boolean | off | Prints the version, for example `1.14.0`, and exits `0`. |
| `--verbose` | `-V` | boolean | off | Prints debug messages as well as normal output. |
| `--silent` | none | boolean | off | Prints nothing, error messages included. The exit code is unchanged. |
| `--debug-cli` | none | boolean | off | Prints the debug messages of `clibuilder`, the library `buddy` is built on. |
| `--show-config` | none | boolean | off | Prints where the config was loaded from and its contents, then exits `0` without running a command. |

These options do not apply to the [skill script commands](/repobuddy/cli/skill-scripts/). Those commands parse
their own arguments.

## `--show-config`

```sh
buddy --show-config
```

With a `.repobuddy.json`:

```
config: /home/me/my-app/.repobuddy.json
{
  "plugins": [
    "@repobuddy/typescript"
  ]
}
```

With a `repobuddy` key in `package.json`:

```
config: /home/me/my-app/package.json (property "repobuddy")
{
  "plugins": [
    "@repobuddy/typescript"
  ]
}
```

With no config:

```
config: not found
```

See [Config file](/repobuddy/cli/#config-file) for the names `buddy` looks for.

## `--silent`

```sh
buddy test-scripts --cwd nope --silent
echo $?
```

```
1
```

The error message is suppressed. Check the exit code instead.

## `--verbose` and `--debug-cli`

Both print a `clibuilder argv:` line with the full command line, then the command's normal output.

## Related

- [`buddy` overview](/repobuddy/cli/)
