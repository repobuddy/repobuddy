---
spec-type: behavioral
---

# CLI shell

*Stub — the entry points below are named, but the control-flow graph and scenario map are authored
in this node's explore pass.*

## What

The program a user actually runs, considered apart from any single command. Installing the
`repobuddy` package puts two executables on the path — `buddy` and the shorter `bd` — and both start
the same program. Before any command runs, the shell decides what the user asked for: a version, a
description of the tool, help text, a known command, or something it does not recognize.

Almost all of this is *inherited behavior* — `clibuilder` supplies the parsing and the help
rendering. It is specified here regardless, because a consumer cannot tell inherited behavior from
authored behavior, and a `clibuilder` upgrade that changed it would be a break in `repobuddy`.

**Non-goals.** The behavior of any individual command (those belong to their own capability nodes);
how commands contributed by plugins are registered (`plugin-management/plugin-contract/`); and the
`package.json` `bin` mapping that puts the executables on the path in the first place (`tooling/`).

## Use Cases

*(To be authored — one row per entry point, as trigger / inputs / outcome. The surfaces this node
covers: invoking `buddy` with no arguments, `--version`, `--help`, and an unrecognized command.)*
