# resume-session

Pick up work that [`pause-session`](../pause-session/README.md) checkpointed. It continues from the
checkpoint's next step and doesn't reopen decisions the checkpoint records as settled.

## When to use

- "pick up where we left off"
- "resume the flaky-login-test work"
- "continue from the checkpoint"

## Usage

```
/resume-session [checkpoint slug or path | repo path]
```

The name differs from the `/resume` built into Claude Code, Codex, Copilot CLI and Gemini CLI, so it
doesn't collide with it. Typing `/resume` lists both.

## What it does

1. Finds the checkpoint in `.agents/repobuddy/checkpoints/`. It uses the one you named, or the only
   paused one. When several are paused, it lists them newest first, with title, branch and next step,
   and asks, even if one matches your current branch.
2. Checks the checkpoint against the repo. It flags a different branch, commits that landed since the
   pause, and state from `## Not in git` that isn't here.
3. Reloads the working method and the settled decisions, and raises any open question that blocks the
   next step.
4. Runs the next step and keeps the checkpoint current as decisions are made.
5. Deletes the checkpoint once the work is done. Anything worth keeping goes into a commit, an ADR or an
   issue.

Give it another repo's path instead (`/resume-session ../other-repo`) and it lists that repo's paused
checkpoints, lets you pick, and hands back the command that starts a fresh session there, such as
`cd ../other-repo && claude "/resume-session <slug>"`. It doesn't switch the current session over,
because the session would keep this repo's working directory, instructions, skills and permissions.

With no checkpoint but an in-progress SDD mission plan, it hands off to cyber-sdd's `resume-mission`
(when installed).

## Install

```sh
npx skills add repobuddy/repobuddy --skill pause-session --skill resume-session
```
