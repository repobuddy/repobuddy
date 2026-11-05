---
name: checkpoint
description: "Use this skill when pausing a session into topic checkpoints or resuming one, in this repo or another."
argument-hint: "create [focus] [--commit] | resume [slug|path|repo] | help"
---

# Checkpoint

A router for handing work between agent sessions. `create` writes the session's live topics to
checkpoints a cold session can continue from; `resume` picks one up. It picks the subcommand that fits
the request, then loads that subcommand's instructions and follows them. It does no work itself.

## Subcommands

| Subcommand | Use it when | Instructions |
|---|---|---|
| `create [focus] [--commit]` | The user wants to stop and pick the work up later, in another session, harness, machine, or repo | [references/create.md](references/create.md) |
| `resume [slug\|path\|repo]` | The user wants to continue work a checkpoint holds, or to see another repo's checkpoints | [references/resume.md](references/resume.md) |
| `help` | The user asks what the skill does, or invokes it bare in a session with work in a repo that already has checkpoints | the **Help** section below |

## Routing

Take the first rule that matches, and load only the reference for the subcommand it picks:

1. **An explicit subcommand.** `/checkpoint create`, `/checkpoint resume auth-refactor`, `/checkpoint help`. The
   rest of the arguments go to that subcommand.
2. **Intent read from the request.** "Let's stop here", "wrap up for now", "checkpoint this", "hand
   this off" route to `create`. "Pick up X", "continue from the checkpoint", "where did we leave off"
   route to `resume`. If the request could be either, ask which one.
3. **`resume` in a fresh session.** A bare `/checkpoint` with no request around it, in a session that is
   new or just cleared, routes to `resume`: the session holds no work to `create` from. Judge it from
   your own conversation: it is fresh when it has no user turn and no tool call before this
   invocation. Local-command records such as `/clear` or `/resume`, and the harness's startup context,
   are not work. A single earlier user turn of any kind, or any tool work, makes the session non-fresh.
   `resume` already handles a repo with no checkpoint: it says so and stops, and the user can ask for
   help from there.
4. **`create` when the repo has no checkpoint.** A bare `/checkpoint` with no request around it, in a
   session with work, inside a git repo, checks for checkpoints with
   `ls "$(git rev-parse --show-toplevel)/.agents/repobuddy/checkpoints/"*.md`.
   If that lists nothing, there is nothing to resume: route to `create` as if the user had typed
   `/checkpoint create`.
5. **`help`.** A bare `/checkpoint` in a session with work in a repo that has checkpoints, a bare one
   outside a git repo, or a request no rule above matches, shows the help below. Do not guess.

## Help

Show this, then ask which subcommand the user wants:

- `checkpoint`: with nothing after it, runs `resume` in a new or just-cleared session; in a session with
  work, runs `create` when the repo has no checkpoint yet, and shows this list otherwise.
- `checkpoint create [focus] [--commit]`: sorts the session's work into topics, skips the finished ones,
  and writes one checkpoint per live topic (or one for all, asked). Example: `/checkpoint create the flaky
  login test`.
- `checkpoint resume [slug|path|repo]`: opens a checkpoint and continues from its next step without
  reopening settled decisions. Example: `/checkpoint resume flaky-login-test`.
- `checkpoint help`: this list.

Checkpoints live at `<repo root>/.agents/repobuddy/checkpoints/<slug>.md`, ignored through
`.git/info/exclude`, or at `~/.agents/repobuddy/checkpoints/` outside a repo. `--commit` commits the
ones written to the current repo.

**Another repo.** When a session in one repo drifts into work on another, `create` writes that topic's
checkpoint into the other repo and gives the line to type to resume it from a session there.
`resume <path to the other repo>` lists that repo's checkpoints and hands back the line to
move there.
