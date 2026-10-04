# pause-session

Pause any agent session (debugging, research, a design discussion, a half-done refactor) and write a
checkpoint per topic that a fresh session can pick up without going back over settled ground. Pair it with
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

1. Sorts the session's work into topics: independent threads such as a bug fix, a side refactor or a
   research question. Threads that share a goal or the same files stay one topic.
2. Skips work that is done. A committed fix or an answered question gets no checkpoint, only a
   one-line commit or PR reference where live work builds on it. Tangents with nothing left to do are
   dropped.
3. When more than one topic has work left, shows each one with its slug and next step and asks
   whether to write one checkpoint per topic or keep them in one, with a recommendation. With one live
   topic it doesn't ask. With a focus argument it checkpoints only that topic and names the others it
   left out. In a run with no one to ask, it takes the recommendation and says why.
4. Writes each checkpoint to `.agents/repobuddy/checkpoints/<slug>.md` at the repo root
   (`~/.agents/repobuddy/checkpoints/` outside a repo). The next action comes first, followed by the
   goal, settled decisions, open questions, working method, the files, commits and issues touched,
   the state that isn't in git, and the skills the next session should use. Split checkpoints each
   stand alone: shared context is copied into each, and a topic that has to wait for another names it
   in `depends-on`, which `resume-session` shows as `waits on <slug>`.
5. On first use in a repo, adds the checkpoint folder to `.git/info/exclude` (shared by every
   worktree), not to your tracked `.gitignore`, so checkpoints never show up as untracked files.
6. Gives commits, files, issues and ADRs as references and doesn't paste their contents.
7. Redacts secrets and personal data. With `--commit`, it also drops absolute paths, usernames and
   hostnames.
8. Leaves your uncommitted work alone and lists it in the checkpoint, so you know it won't travel on
   its own.
9. Commits only the checkpoints, and only with `--commit`, staging them with `git add -f` past the
   exclude. Use that flag when the work has to move to another machine or another person.
10. Reports every checkpoint written with its next step, and the topics it skipped as done.

If a topic is an SDD mission, it hands that topic off to cyber-sdd's `pause-mission` (when installed), which
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
