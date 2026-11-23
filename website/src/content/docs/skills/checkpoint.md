---
title: checkpoint
description: Pause agent work into per-topic checkpoints and resume them in a fresh session, in this repo or another.
---

`checkpoint` hands work between agent sessions. `save` writes a checkpoint per live topic that a cold session can
continue from. `resume` picks one up and continues from its next step. It was named `session` before 4.0, and replaced
the earlier `pause-session` and `resume-session` skills. The old names were removed with no aliases.

## When to use

- "pause here, I'll pick this up tomorrow" or "wrap up for now"
- The context window is filling and you want a clean restart. Pause before the harness compacts on its own.
- "pick up where we left off" or "resume the flaky-login-test work"
- A session in one repo drifted into work on another.

## Invoke

```
/checkpoint save [<what the next session should focus on>] [--commit]
/checkpoint resume [<checkpoint slug> | <path> | <repo path>]
/checkpoint list [<repo path>]
/checkpoint help
```

Type the skill's name the way your harness invokes it. The lines above use `/checkpoint`, which is right for a Skills
CLI install in Copilot CLI and the Cursor editor:

| Harness | From the repobuddy plugin | Installed by the Skills CLI |
| --- | --- | --- |
| Claude Code | `/repobuddy:checkpoint` | ask in words: `/checkpoint` is an alias of the built-in `/rewind` |
| Codex CLI | `$repobuddy:checkpoint` | `$checkpoint` |
| Copilot CLI | ask in words (namespacing not documented) | `/checkpoint` |
| Cursor | ask in words (namespacing not documented) | `/checkpoint` in the editor's Agent chat; ask in words in the `agent` CLI |
| Gemini CLI | — | ask in words |

"Ask in words" means a request such as "use the checkpoint skill to resume flaky-login-test". The resume lines the
skill hands back use the same form.

Natural phrasing routes too: "let's stop here" saves a checkpoint, "pick up the auth refactor" resumes, "what checkpoints do I have" lists them. A bare `/checkpoint`
runs `resume` in a new or just-cleared session. In a session that resumed or wrote exactly one checkpoint and stayed on
its goal, it updates that checkpoint with no prompt. In other sessions with work, it runs `save` in a git repo that has
no checkpoint yet, and shows help in a repo that has some or outside a git repo.

### Keep a checkpoint current

The skill cannot wake itself, but Claude Code can run the bare invocation on a schedule. In a session on one
checkpoint, `/loop 20m /repobuddy:checkpoint` updates it every 20 minutes while the session is idle. A `Stop` hook can
ask for an update after every turn, but it costs a model turn per reply. The hook recipe is in the
[skill README](https://github.com/repobuddy/repobuddy/blob/main/packages/buddy/skills/checkpoint/README.md#keep-a-checkpoint-current-automatically).
A drifted session asks instead of updating, which stalls an unattended run.

### save

- Sorts the session's requests into topics and skips finished work, deleting a finished or abandoned topic's old
  checkpoint. Age alone never deletes one.
- Matches each topic to its existing checkpoint (the one this session resumed, or one with the same goal) and merges
  into it, keeping its settled decisions and dead ends.
- With several live topics, asks whether to write one checkpoint per topic or one for all, and recommends one. With a
  focus argument it checkpoints only that topic.
- Writes `<common git dir>/repobuddy/checkpoints/<slug>.md` in the topic's home repo, with the next action first, then the goal and what is done so far. The
  common git dir is shared by a plain clone, the main checkout and every linked worktree, so every checkout sees the
  checkpoint, and removing a worktree or running `git clean -fdx` leaves it in place. A topic about another repo is
  written into that repo with a `repo:` field. If that repo is not on disk it asks where it is, or falls back to
  `~/.agents/repobuddy/checkpoints/`.
- Moves a checkpoint an earlier version wrote to `.agents/repobuddy/checkpoints/` in the checkout into the git dir.
  Changes neither the working tree nor `.gitignore`. Redacts secrets and personal data. Lists uncommitted work but
  does not touch it.
- `--commit` copies the current repo's checkpoints to `.agents/repobuddy/checkpoints/` in the checkout and commits the
  copies with `git add -f` and a message in the repo's commit convention, after dropping absolute paths, usernames,
  and hostnames. A checkpoint in another repo
  stays uncommitted.

### list

- Shows the checkpoints and stops. It never opens or continues one. It runs
  [`buddy checkpoint list`](/repobuddy/cli/skill-scripts/checkpoint/), which `resume` also runs to find a checkpoint.
- Covers the checkpoints in this repo's common git dir, a committed or older copy in this checkout's
  `.agents/repobuddy/checkpoints/`, and the ones in `~/.agents/repobuddy/checkpoints/` whose `repo:` names this repo. Outside a repo it shows the home folder. Given a repo path, it shows that repo's checkpoints, with no
  hand-off and no `cd`.
- Each row has the title, the branch and the worktree it is checked out in, the `updated` date, next step, `waits on <slug>` and, for a resumed checkpoint, whether
  its session is still alive. With none, it says so and stops.

### resume

- Finds the checkpoint (one you name, the only one, or a newest-first list to choose from). Warns when `repo:` names
  another repo.
- Opens with a short summary before any action: what the work is and its goal, what is done, what is left, and the
  next step, with any open question waiting on you. Branch state, commit ids and the marker come after it, briefly.
  A checkpoint without `## Done so far`, written by an earlier version, still resumes.
- Resumes by branch: on the checkpoint's branch it continues in place. When another worktree has the branch, it names
  that worktree, gives the line to resume there, and stops. When no worktree has it, it says the branch has to be
  checked out and leaves how to you. It never switches branches, and a tool that manages worktrees or sessions can
  act on those stop lines from its own side.
- Flags new commits and state that was not in git. If the new commits already
  met the goal, it asks whether to delete the checkpoint.
- Reloads the working method and settled decisions, avoids retrying listed dead ends, and runs the next step.
- Writes a `resumed:` marker (time, harness, session id, process id, start time) into the checkpoint. The list warns
  about a marked checkpoint and checks whether its process is alive; it asks before opening one that is alive or
  can't be checked, and never hides it. `save` removes the marker, and warns if another session resumed the file
  meanwhile.
- Keeps the checkpoint until the work is done, then deletes it.
- Given another repo's path, it lists that repo's checkpoints and gives the line to start a session there. It never runs `cd`.

There is no `update` subcommand. `save` is the update: a topic that matches an existing checkpoint is merged into it,
and "update the checkpoint" routes to `save`.

## Hands off to

For an SDD mission topic it hands off to cyber-sdd's `pause-mission` and `resume-mission` when installed.

## Requirements

`git`, and Node.js for `list` and `resume`: they run `buddy checkpoint list` through the skill's `scripts/repobuddy.mjs`,
which uses the installed `repobuddy` package, or `npx -y repobuddy@<version>` (network on first run) outside it. Moving a live session to another repo uses `/cd` in Claude Code (v2.1.246+) and
Codex (0.150.0+); Copilot CLI has `/cd` without a documented instruction reload; Gemini CLI and Cursor need a fresh
session started in the repo. Exact lines are in the skill's `references/harness/`.

## Example

```
/repobuddy:checkpoint save the flaky login test --commit
```

That is the Claude Code plugin form; use your harness's form from the table above.

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/checkpoint).
