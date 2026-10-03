# pause-session

Pause any agent session (debugging, research, a design discussion, a half-done refactor) and write a
checkpoint that a fresh session can pick up without going back over settled ground. Pair it with
[`resume-session`](../resume-session/README.md).

## When to use

- "pause here, I'll pick this up tomorrow"
- "wrap up for now"
- "hand this off to another session"
- when the context window is filling up and you want a clean restart

## Usage

```
/pause-session [what the next session should focus on] [--commit]
```

## What it does

1. Writes `.agents/repobuddy/checkpoints/<slug>.md` at the repo root (`~/.agents/repobuddy/checkpoints/` outside a repo).
   The next action comes first, followed by the goal, settled decisions, open questions, working method,
   the files, commits and issues touched, the state that isn't in git, and the skills the next session
   should use.
2. On first use in a repo, adds the checkpoint folder to `.git/info/exclude` (shared by every
   worktree), not to your tracked `.gitignore`, so checkpoints never show up as untracked files.
3. Gives commits, files, issues and ADRs as references and doesn't paste their contents.
4. Redacts secrets and personal data. With `--commit`, it also drops absolute paths, usernames and
   hostnames.
5. Leaves your uncommitted work alone and lists it in the checkpoint, so you know it won't travel on
   its own.
6. Commits only the checkpoint, and only with `--commit`, staging it with `git add -f` past the
   exclude. Use that flag when the work has to move to another machine or another person.

If the session is an SDD mission, it hands off to cyber-sdd's `pause-mission` (when installed), which
checkpoints into the mission's plan brief instead.

## Why not `/resume` or `/handoff`?

Harness built-ins such as Claude Code's `/resume` and Gemini's `/chat save` restore a transcript in one
harness on one machine. A checkpoint records the state of the work, so another harness, another machine
or another person can read it. `/handoff` writes to the OS temp directory and has no resume side. This
checkpoint lives where `resume-session` can find it again.

## Install

```sh
npx skills add repobuddy/repobuddy --skill pause-session --skill resume-session
```
