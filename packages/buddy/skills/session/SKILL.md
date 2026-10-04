---
name: session
description: "Use this skill when pausing a session into topic checkpoints or resuming one, in this repo or another."
argument-hint: "pause [focus] [--commit] | resume [slug|path|repo] | help"
---

# Session

A router for handing work between agent sessions. `pause` writes the session's live topics to
checkpoints a cold session can continue from; `resume` picks one up. It picks the subcommand that fits
the request, then loads that subcommand's instructions and follows them. It does no work itself.

## Subcommands

| Subcommand | Use it when | Instructions |
|---|---|---|
| `pause [focus] [--commit]` | The user wants to stop and pick the work up later, in another session, harness, machine, or repo | [references/pause.md](references/pause.md) |
| `resume [slug\|path\|repo]` | The user wants to continue work a checkpoint holds, or to see another repo's paused work | [references/resume.md](references/resume.md) |
| `help` | The user asks what the skill does, or invokes it with no subcommand and no clear intent | the **Help** section below |

## Routing

Take the first rule that matches, and load only the reference for the subcommand it picks:

1. **An explicit subcommand.** `/session pause`, `/session resume auth-refactor`, `/session help`. The
   rest of the arguments go to that subcommand.
2. **Intent read from the request.** "Let's stop here", "wrap up for now", "checkpoint this", "hand
   this off" route to `pause`. "Pick up X", "continue from the checkpoint", "where did we leave off"
   route to `resume`. If the request could be either, ask which one.
3. **`help`.** A bare `/session` with no request around it, or a request no rule above matches, shows
   the help below. Do not guess.

## Help

Show this, then ask which subcommand the user wants:

- `session pause [focus] [--commit]`: sorts the session's work into topics, skips the finished ones,
  and writes one checkpoint per live topic (or one for all, asked). Example: `/session pause the flaky
  login test`.
- `session resume [slug|path|repo]`: opens a checkpoint and continues from its next step without
  reopening settled decisions. Example: `/session resume flaky-login-test`.
- `session help`: this list.

Checkpoints live at `<repo root>/.agents/repobuddy/checkpoints/<slug>.md`, ignored through
`.git/info/exclude`, or at `~/.agents/repobuddy/checkpoints/` outside a repo. `--commit` commits the
ones written to the current repo.

**Another repo.** When a session in one repo drifts into work on another, `pause` writes that topic's
checkpoint into the other repo and gives the line to type to resume it from a session there.
`resume <path to the other repo>` lists that repo's paused checkpoints and hands back the line to
move there.
