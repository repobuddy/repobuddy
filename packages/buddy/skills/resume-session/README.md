# resume-session

Pick up work that [`pause-session`](../pause-session/README.md) checkpointed. It continues from the
checkpoint's next step and doesn't reopen decisions the checkpoint records as settled.

## When to use

- "pick up where we left off"
- "resume the flaky-login-test work"
- "continue from the checkpoint"

## Usage

```
/resume-session [checkpoint slug or path]
```

The name differs from the `/resume` built into Claude Code, Codex, Copilot CLI and Gemini CLI, so it
doesn't collide with it. Typing `/resume` lists both.

## What it does

1. Finds the checkpoint in `.agents/repobuddy/checkpoints/`. It uses the one you named, or the single paused
   checkpoint on your current branch. Otherwise it lists them newest first and asks.
2. Checks the checkpoint against the repo. It flags a different branch, commits that landed since the
   pause, and state from `## Not in git` that isn't here.
3. Reloads the working method and the settled decisions, and raises any open question that blocks the
   next step.
4. Runs the next step and keeps the checkpoint current as decisions are made.
5. Deletes the checkpoint once the work is done. Anything worth keeping goes into a commit, an ADR or an
   issue.

With no checkpoint but an in-progress SDD mission plan, it hands off to cyber-sdd's `resume-mission`
(when installed).

## Install

```sh
npx skills add repobuddy/repobuddy --skill pause-session --skill resume-session
```
