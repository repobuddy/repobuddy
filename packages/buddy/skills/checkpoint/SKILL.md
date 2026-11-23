---
name: checkpoint
description: "Saves a session's work into topic checkpoints, resumes one, or lists them, in this repo or another. Say \"save a checkpoint\", \"pick up where we left off\", or \"what checkpoints do I have\"."
argument-hint: "save [<what to focus on>] [--commit] | resume [<slug> | <path> | <repo path>] | list [<repo path>] | help"
---

# Checkpoint

A router for handing work between agent sessions. `save` writes the session's live topics to
checkpoints a cold session can continue from; `resume` picks one up; `list` shows what exists. It picks the subcommand that fits
the request, then loads that subcommand's instructions and follows them. It does no work itself.

## Subcommands

| Subcommand | Use it when | Instructions |
|---|---|---|
| `save [<what to focus on>] [--commit]` | The user wants to stop and pick the work up later, in another session, harness, machine, or repo | [references/save.md](references/save.md) |
| `resume [<slug> \| <path> \| <repo path>]` | The user wants to continue work a checkpoint holds, or to see another repo's checkpoints | [references/resume.md](references/resume.md) |
| `list [<repo path>]` | The user wants to see the checkpoints, not open one | [references/list.md](references/list.md) |
| `help` | The user asks what the skill does, or invokes it bare in a session with work in a repo that already has checkpoints | the **Help** section below |

## Routing

Take the first rule that matches, and load only the reference for the subcommand it picks:

1. **An explicit subcommand.** `save`, `resume auth-refactor`, `list` or `help` right after the skill's
   name, in whatever form the harness invoked it. The rest of the arguments go to that subcommand.
   `create`, the name `save` had before, is an alias: it routes to `save` with its arguments.
2. **Intent read from the request.** "Save a checkpoint", "pause", "let's stop here", "wrap up for now",
   "checkpoint this", "create a checkpoint", "update the checkpoint", "hand this off" route to `save`. "Pick up X", "continue from the checkpoint", "where did we leave off"
   route to `resume`. "What checkpoints are there", "list checkpoints", "show my checkpoints"
   route to `list`. If the request could be either, ask which one.
3. **`resume` in a fresh session.** A bare `/checkpoint` with no request around it, in a session that is
   new or just cleared, routes to `resume`: the session holds no work to `save` from. Judge it from
   your own conversation: it is fresh when it has no user turn and no tool call before this
   invocation. Local-command records such as `/clear` or `/resume`, and the harness's startup context,
   are not work. A single earlier user turn of any kind, or any tool work, makes the session non-fresh.
   `resume` already handles a repo with no checkpoint: it says so and stops, and the user can ask for
   help from there.
4. **`save` to update the session's one checkpoint.** A bare `/checkpoint` with no request around it, in
   a session with work, where the session resumed exactly one checkpoint, or wrote exactly one earlier, and
   every request since belongs to that checkpoint's `## Goal`. Route to `save` with that checkpoint's
   slug as the focus, and do not ask. If the session also did work outside that goal, or resumed or
   wrote more than one checkpoint, this rule does not match: go on to the next rule.
5. **`save` when the repo has no checkpoint.** A bare `/checkpoint` with no request around it, in a
   session with work, inside a git repo, checks for checkpoints with
   `node <this-skill-dir>/scripts/repobuddy.mjs checkpoint list --json`, which reads every folder a
   checkpoint of this repo can be in. If its `checkpoints` is empty, there is nothing to resume:
   route to `save` as if the user had typed `/checkpoint save`.
6. **`help`.** A bare `/checkpoint` in a session with work in a repo that has checkpoints, a bare one
   outside a git repo, or a request no rule above matches, shows the help below. Do not guess.

## Help

Show this, then ask which subcommand the user wants. Write each example with the skill's name as this
harness invokes it, from [references/command.md](references/command.md), in place of `/checkpoint`:

- `checkpoint`: with nothing after it, runs `resume` in a new or just-cleared session; in a session on one
  checkpoint and no other topic, updates that checkpoint; in other sessions with work, runs `save` when
  the repo has no checkpoint yet, and shows this list otherwise.
- `checkpoint save [<what to focus on>] [--commit]`: sorts the session's work into topics, skips the finished ones,
  and writes one checkpoint per live topic (or one for all, asked). A topic that matches an existing
  checkpoint rewrites it, so this is also how to update one. Example: `/checkpoint save the flaky
  login test`.
- `checkpoint resume [<slug> | <path> | <repo path>]`: opens a checkpoint and continues from its next step without
  reopening settled decisions. Example: `/checkpoint resume flaky-login-test`.
- `checkpoint list [<repo path>]`: shows the checkpoints (this repo's, or the given repo's) with their next
  steps, and stops without opening one. Example: `/checkpoint list`.
- `checkpoint help`: this list.

Checkpoints live in the repo's common git dir, at `<common dir>/repobuddy/checkpoints/<slug>.md`, so
a plain clone, the main checkout and every linked worktree share them; outside a repo, at
`~/.agents/repobuddy/checkpoints/`. `--commit` copies the ones written to the current repo to
`.agents/repobuddy/checkpoints/` in the checkout and commits the copies. `resume` continues in the
checkout that has the checkpoint's branch: here, or it names the worktree that holds the branch and
stops.

**Another repo.** When a session in one repo drifts into work on another, `save` writes that topic's
checkpoint into the other repo and gives the line to type to resume it from a session there.
`resume <path to the other repo>` lists that repo's checkpoints and hands back the line to
move there.

## Done when

Before reporting done, check each of these against the result. Report any that fails.

- **C1.** `help` listed `save`, `resume`, `list` and `help`, and changed no file.

Each subcommand's own criteria are at the end of its file: [save](references/save.md#done-when),
[resume](references/resume.md#done-when), [list](references/list.md#done-when).
