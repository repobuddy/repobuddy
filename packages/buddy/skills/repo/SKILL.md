---
name: repo
description: "Sets up how a repo is worked in: enhance offers vetted AGENTS.md sections, such as auto-commit."
argument-hint: "enhance [--root <dir>] | help"
---

# Repo

A router for setting up how agents work in a repository. It picks the subcommand that fits the
request, then loads that subcommand's instructions and follows them. It does no work itself.

`repo` covers the repository: rules every agent working in it follows. How one agent works in any
repository, such as delegation, belongs to `buddy-agent-harness`.

## Subcommands

| Subcommand | Use it when | Instructions |
|---|---|---|
| `enhance [--root <dir>]` | The user wants the vetted sections the repo's `AGENTS.md` is missing, a stale one refreshed, or a named one such as auto-commit or commit discipline set up | [references/enhance.md](references/enhance.md) |
| `help` | The user asks what the skill does, or invokes it bare | the **Help** section below |

## Routing

Take the first rule that matches, and load only the reference for the subcommand it picks:

1. **An explicit subcommand.** `/repo enhance`, `/repo help`. The rest of the arguments go to that
   subcommand.
2. **Intent read from the request.** "Enhance the repo's AGENTS.md", "what is AGENTS.md missing",
   "set up auto-commit", "make agents commit each unit", "add commit discipline", "refresh the commit
   discipline section" route to `enhance`.
3. **`help`.** A bare `/repo`, or a request no rule above matches, shows the help below. Do not guess.

## Help

Show this, then ask which subcommand the user wants:

- `repo enhance [--root <dir>]`: checks the repo's instructions for each vetted section (today:
  Commit Discipline, which has agents commit each finished unit of work unasked), offers what is
  missing or stale one at a time, and writes only what you approve. It recommends the repo's
  `AGENTS.md` and offers your global `~/.agents/AGENTS.md` as the alternative, which it hands over
  instead of writing.
- `repo help`: this list.
