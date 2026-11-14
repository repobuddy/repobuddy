---
title: checkpoint
description: Pause agent work into per-topic checkpoints and resume them in a fresh session, in this repo or another.
---

`checkpoint` hands work between agent sessions. `create` writes a checkpoint per live topic that a cold session can
continue from. `resume` picks one up and continues from its next step. It was named `session` before 4.0, and replaced
the earlier `pause-session` and `resume-session` skills. The old names were removed with no aliases.

## When to use

- "pause here, I'll pick this up tomorrow" or "wrap up for now"
- The context window is filling and you want a clean restart. Pause before the harness compacts on its own.
- "pick up where we left off" or "resume the flaky-login-test work"
- A session in one repo drifted into work on another.

## Invoke

```
/checkpoint create [what the next session should focus on] [--commit]
/checkpoint resume [checkpoint slug | path | repo path]
/checkpoint list [repo path]
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

Natural phrasing routes too: "let's stop here" creates a checkpoint, "pick up the auth refactor" resumes, "what checkpoints do I have" lists them. A bare `/checkpoint`
runs `resume` in a new or just-cleared session. In a session with work, it runs `create` in a git repo that has no
checkpoint yet, and shows help in a repo that has some or outside a git repo.

### create

- Sorts the session's requests into topics and skips finished work, deleting a finished or abandoned topic's old
  checkpoint. Age alone never deletes one.
- Matches each topic to its existing checkpoint (the one this session resumed, or one with the same goal) and merges
  into it, keeping its settled decisions and dead ends.
- With several live topics, asks whether to write one checkpoint per topic or one for all, and recommends one. With a
  focus argument it checkpoints only that topic.
- Writes `.agents/repobuddy/checkpoints/<slug>.md` at the root of the topic's home repo, with the next action first. A
  topic about another repo is written into that repo with a `repo:` field. If that repo is not on disk it asks where it
  is, or falls back to `~/.agents/repobuddy/checkpoints/`.
- Adds the folder to `.git/info/exclude`, not `.gitignore`. Redacts secrets and personal data. Lists uncommitted work
  but does not touch it.
- `--commit` commits only the checkpoints in the current repo, with `git add -f`, after dropping absolute paths,
  usernames, and hostnames. A checkpoint in another repo stays uncommitted.

### list

- Shows the checkpoints and stops. It never opens or continues one.
- Covers this repo's `.agents/repobuddy/checkpoints/` plus the ones in `~/.agents/repobuddy/checkpoints/` whose `repo:`
  names this repo. Outside a repo it shows the home folder. Given a repo path, it shows that repo's checkpoints, with no
  hand-off and no `cd`.
- Each row has the title, branch, `updated` date, next step, `waits on <slug>` and, for a resumed checkpoint, whether
  its session is still alive. With none, it says so and stops.

### resume

- Finds the checkpoint (one you name, the only one, or a newest-first list to choose from). Warns when `repo:` names
  another repo, then flags a different branch, new commits, and state that was not in git. If the new commits already
  met the goal, it asks whether to delete the checkpoint.
- Reloads the working method and settled decisions, avoids retrying listed dead ends, and runs the next step.
- Writes a `resumed:` marker (time, harness, session id, process id, start time) into the checkpoint. The list warns
  about a marked checkpoint and checks whether its process is alive; it asks before opening one that is alive or
  can't be checked, and never hides it. `create` removes the marker, and warns if another session resumed the file
  meanwhile.
- Keeps the checkpoint until the work is done, then deletes it.
- Given another repo's path, it lists that repo's checkpoints and gives the line to start a session there. It never runs `cd`.

There is no `update` subcommand. `create` is the update: a topic that matches an existing checkpoint is merged into it,
and "update the checkpoint" routes to `create`.

## Hands off to

For an SDD mission topic it hands off to cyber-sdd's `pause-mission` and `resume-mission` when installed.

## Requirements

`git`. No CLI, network, or script. Moving a live session to another repo uses `/cd` in Claude Code (v2.1.246+) and
Codex (0.150.0+); Copilot CLI has `/cd` without a documented instruction reload; Gemini CLI and Cursor need a fresh
session started in the repo. Exact lines are in the skill's `references/harness/`.

## Example

```
/repobuddy:checkpoint create the flaky login test --commit
```

That is the Claude Code plugin form; use your harness's form from the table above.

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/checkpoint).
