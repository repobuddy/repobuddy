---
title: session
description: Pause agent work into per-topic checkpoints and resume them in a fresh session, in this repo or another.
---

`session` hands work between agent sessions. `pause` writes a checkpoint per live topic that a cold session can continue
from. `resume` picks one up and continues from its next step. It replaces the earlier `pause-session` and
`resume-session` skills, which were removed with no aliases.

## When to use

- "pause here, I'll pick this up tomorrow" or "wrap up for now"
- The context window is filling and you want a clean restart. Pause before the harness compacts on its own.
- "pick up where we left off" or "resume the flaky-login-test work"
- A session in one repo drifted into work on another.

## Invoke

```
/session pause [what the next session should focus on] [--commit]
/session resume [checkpoint slug | path | repo path]
/session help
```

Natural phrasing routes too: "let's stop here" pauses, "pick up the auth refactor" resumes. A bare `/session` shows help.

### pause

- Sorts the session's requests into topics and skips finished work.
- With several live topics, asks whether to write one checkpoint per topic or one for all, and recommends one. With a
  focus argument it checkpoints only that topic.
- Writes `.agents/repobuddy/checkpoints/<slug>.md` at the root of the topic's home repo, with the next action first. A
  topic about another repo is written into that repo with a `repo:` field. If that repo is not on disk it asks where it
  is, or falls back to `~/.agents/repobuddy/checkpoints/`.
- Adds the folder to `.git/info/exclude`, not `.gitignore`. Redacts secrets and personal data. Lists uncommitted work
  but does not touch it.
- `--commit` commits only the checkpoints in the current repo, with `git add -f`, after dropping absolute paths,
  usernames, and hostnames. A checkpoint in another repo stays uncommitted.

### resume

- Finds the checkpoint (one you name, the only one, or a newest-first list to choose from). Warns when `repo:` names
  another repo, then flags a different branch, new commits, and state that was not in git.
- Reloads the working method and settled decisions, avoids retrying listed dead ends, and runs the next step.
- Marks the file `status: resumed`. It deletes the checkpoint only when the work is done.
- Given another repo's path, it lists that repo's checkpoints and gives the line to start a session there. It never runs `cd`.

## Hands off to

For an SDD mission topic it hands off to cyber-sdd's `pause-mission` and `resume-mission` when installed.

## Requirements

`git`. No CLI, network, or script. Moving a live session to another repo uses `/cd` in Claude Code (v2.1.246+) and
Codex (0.150.0+); Copilot CLI has `/cd` without a documented instruction reload; Gemini CLI and Cursor need a fresh
session started in the repo. Exact lines are in the skill's `references/harness/`.

## Example

```
/session pause the flaky login test --commit
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/session).
