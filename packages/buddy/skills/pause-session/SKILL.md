---
name: pause-session
description: "Use this skill when pausing any agent session to pick up later — writes a checkpoint a cold session resumes from."
argument-hint: "[what the next session should focus on] [--commit]"
---

# Pause a session into a checkpoint

Write this session's state to one checkpoint file so a fresh session, in any harness, on any machine
the file reaches, can continue without going back over settled ground. Capture *enough to continue,
nothing to relitigate.*

`resume-session` is the matching reader, but the checkpoint must stand on its own. A session that only
opens the file has to be able to continue.

## Procedure

1. **Hand an SDD mission to its own pair.** If this session is working an SDD mission (an
   `.agents/plans/*.plan.md` whose todos are `in_progress` and this work is one of them) and the
   `pause-mission` skill is available, use `pause-mission` instead and stop. The mission's plan brief
   already holds its state, so a second file would split that state in two. If `pause-mission` isn't
   available, continue with this skill and put a pointer to the plan brief in `## Touched`.

2. **Honor the focus.** If the user said what the next session is for, scope the checkpoint to it.
   Otherwise checkpoint the whole live frontier.

3. **Pick the location.**
   - Inside a git repo: `<repo root>/.agents/checkpoints/<slug>.md`, where the repo root is
     `git rev-parse --show-toplevel`.
   - Outside a repo: `~/.agents/checkpoints/<slug>.md`.

   `<slug>` is a short kebab-case name for the work (`flaky-login-test`, `auth-refactor`), not a
   timestamp. If a checkpoint for the same work already exists, update it rather than creating a
   second one.

4. **Write the checkpoint** in the format below, in this order: **action first**, history after.

5. **Apply the redaction floor.** Never write secrets, tokens, keys, passwords or personal data, even
   when the file stays local. Describe the class of thing ("the staging API key in 1Password"), not its
   value. With `--commit`, the file becomes public to anyone with the repo, so also leave out absolute
   paths, `$HOME`, OS usernames and hostnames. Use repo-relative paths.

6. **Leave the user's work alone.** Don't commit, stash or discard uncommitted changes to make the
   checkpoint tidy. List them under `## Not in git` instead. If they need to reach another machine, say
   so in the reply and let the user decide how to carry them.

7. **Commit only with `--commit`.** By default the checkpoint is written and left uncommitted, because a
   note from a debugging session should not land on a feature branch by accident. With `--commit`, stage
   only the checkpoint file and commit it as `docs: checkpoint <slug>`, so it follows the branch to
   another machine or another person.

8. **Report.** Give the checkpoint path, its `## NEXT` line, and whether it was committed. If there are
   uncommitted changes, say that they won't travel with an uncommitted checkpoint.

## Checkpoint format

```markdown
---
status: paused
focus: <what the next session is for, or "whole frontier">
branch: <current branch, or none>
commit: <short HEAD sha at pause time, or none>
created: <ISO date>
updated: <ISO date>
---

# <Title of the work>

## NEXT — resume here

<One concrete, runnable action: the file or unit to touch and the command or skill to run.
Never "continue the work".>

## Goal

<What done looks like, in one or two lines.>

## Settled decisions

- <decision> — <why, in one line>. Do not reopen without new evidence.

## Open questions

- <question> — options: <a> / <b>. <Which one the evidence leans toward, if any.>

## Working method

<How this work is run: the test or verify command, the commit rhythm, baselines not to touch, and
conventions the next session would otherwise have to rediscover.>

## Touched

- <repo-relative path, commit sha, issue or PR URL> — <one line on why it matters>

## Not in git

<Uncommitted changes (from `git status --short`), running processes, environment setup, external state
such as a deployed preview or an open browser session. Write "nothing" if there is none.>

## Suggested skills

- <skill name> — <what the next session should use it for>
```

Leave out any section that would be empty, except `## NEXT` and `## Not in git`. A cold reader needs
both, and "nothing" in `## Not in git` is itself information.

## What a good checkpoint is not

- **Not a transcript.** Record decisions and the next action, not a play-by-play of the session.
- **Not a copy.** If something already lives in a commit, an ADR, a spec, an issue or a diff, reference
  it by path or URL and don't paste it.
- **Not buried.** The next action comes first. If a reader has to hunt for where to start, the pause
  failed.
- **Not self-referential.** Don't tell the reader to "run `resume-session`" or explain how to resume.
  Whoever opens the file is already past that point. Open `## NEXT` with the work itself.
- **Not final-sounding.** A pause is resumable. Keep the open questions and the live frontier explicit;
  don't smooth them into a summary that hides where to begin.
