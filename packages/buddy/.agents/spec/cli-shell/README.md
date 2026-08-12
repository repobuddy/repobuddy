---
spec-type: behavioral
---

# CLI shell

## What

The program a user actually runs, considered apart from any single command. Installing the
`repobuddy` package puts two executables on the path — `buddy` and the shorter `bd` — and both start
the same program, reporting the version of the installed package.

This node is deliberately **small**. Almost everything the shell does once it starts — argument
parsing, help rendering, flag handling, the order in which it decides things — is clibuilder's, not
repobuddy's, and is recorded in [`../design/inherited-behavior.md`](../design/inherited-behavior.md)
rather than asserted here. What remains are the three things repobuddy genuinely promises and
genuinely wires: that both executables work, that the version reported is this package's version, and
that running the tool with no arguments is a usable thing to do.

**Non-goals.** How the command line is parsed, what help looks like, how `--silent` / `--verbose` /
`--debug-cli` behave, what happens on an unrecognized command or option, and the order in which those
decisions are taken — all clibuilder's mechanism. The behavior of any individual command (their own
capability nodes). The `package.json` `bin` mapping itself (`../tooling/`).

**Known gap, not repobuddy's to fix.** Every rejected command line exits with code 0, so a script
cannot tell a typo from success. This is a clibuilder issue and is tracked in the design note; no
scenario here asserts an exit code in either direction.

## Use Cases

| Use case | Trigger | Inputs | Outcome |
|---|---|---|---|
| **Start the CLI** | The user runs `buddy` or `bd` | Optionally a command and arguments | The program starts and dispatches |
| **Report the version** | `buddy --version` | — | The installed package's version is printed |

## Control Flow

repobuddy's own contribution to startup is small enough to state in one graph: it hands clibuilder a
name, a description, and the version it read from its own `package.json`, then lets clibuilder parse.

```mermaid
graph TD
    A[buddy or bd is invoked] --> B[read the version from this package's package.json]
    B --> C[hand the name, description and version to clibuilder]
    C --> D{was a version flag given?}
    D -->|yes| D1[print that version]
    D -->|no| D2[clibuilder dispatches — see design/inherited-behavior.md]
```

## Scenario map

### Start the CLI

| Edge | Path (Given) | Scenario |
|---|---|---|
| `A → invoked` | any — invoked through either executable name | `bd and buddy start the same program` |
| `D → no` | no command named | `running the CLI with no command prints usage rather than failing` |

### Report the version

| Edge | Path (Given) | Scenario |
|---|---|---|
| `D → yes` | the version flag given | `the version flag prints this package's version` |
