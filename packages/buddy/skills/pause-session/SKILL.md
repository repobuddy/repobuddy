---
name: pause-session
description: "Use this skill when pausing any agent session to pick up later — writes topic checkpoints a cold session resumes from."
argument-hint: "[what the next session should focus on] [--commit]"
---

# Pause a session into checkpoints

Write this session's unfinished work to checkpoint files so a fresh session, in any harness, on any
machine the files reach, can continue without going back over settled ground. Capture *enough to
continue, nothing to relitigate.* A session often holds more than one thread of work, so sort it by
topic first: finished work gets no checkpoint, and each live topic can get its own.

`resume-session` is the matching reader, but each checkpoint must stand on its own. A session that only
opens the file has to be able to continue.

## Procedure

1. **List the user's requests, then sort them into topics.** Read the session from the start and list
   every request the user made, in order, including the ones not started yet. A request with no trace
   in files, commits or the harness's todo list is the easiest to lose, and it is still live work.
   Then sort the requests and the work done on them into topics. A topic is one independent thread of
   work: a bug fix, a side refactor, a research question. Two threads are **one topic** when they share a goal (finishing
   one is part of finishing the other) or have to change the same files, so they can't be resumed in
   separate sessions without colliding. They are **two topics** when each has its own goal, its own
   `## NEXT`, and its own files. A thread that can't start until another finishes is still its own
   topic; record the order (step 6) instead of merging the two.

2. **Drop finished and extra work.** A topic that is done (committed, merged, answered, or abandoned
   on purpose) gets no checkpoint and no history. Where a live topic builds on it, cite it in one line
   under `## Touched` (the commit sha or PR). Drop tangents that left nothing to do. Summarize only
   where a cold reader needs the gist to continue, never as a play-by-play of the session.

   If no topic has work left, write nothing: say so in the report and stop.

3. **Hand SDD mission topics to their own pair.** If a live topic is an SDD mission (an
   `.agents/plans/*.plan.md` whose todos are `in_progress` and this work is one of them) and the
   `pause-mission` skill is available, pause that topic with `pause-mission` and leave it out of the
   checkpoints. The plan brief already holds its state, so a second file would split that state in
   two. If `pause-mission` isn't available, checkpoint the topic here and put a pointer to the plan
   brief in `## Touched`.

4. **Decide how many checkpoints to write.** Take the first rule that matches:
   1. **The user gave a focus.** Checkpoint only the topic it names, and list the other live topics in
      the report, by slug and `## NEXT`, as left out, so the user can pause them too.
   2. **One live topic.** Write one checkpoint. Don't ask.
   3. **Several live topics.** Ask the user whether to write one checkpoint per topic or keep them in
      one. Show each proposed topic with its slug, its `## NEXT` line and what it depends on, and
      give a recommendation:
      - **Split** when the topics can be resumed separately: by different sessions or people, at
        different times, or only some of them soon. This is the usual case, and each session then
        loads only its own topic.
      - **Keep as one** when every topic has a step or two left that one session clears in a sitting,
        or when the topics form a single chain that only makes sense resumed in order.
   4. **No one to ask** (a headless or scheduled run): take the recommendation, and say in the report
      which option it chose and why.

   Kept as one, `## NEXT` holds the first topic's action and `## Remaining topics` holds the others'
   next steps, in the order they should run.

5. **Pick the location.**
   - Inside a git repo: `<repo root>/.agents/repobuddy/checkpoints/<slug>.md`, where the repo root is
     `git rev-parse --show-toplevel`.
   - Outside a repo: `~/.agents/repobuddy/checkpoints/<slug>.md`.

   `<slug>` is a short kebab-case name for the topic (`flaky-login-test`, `auth-refactor`), not a
   timestamp. If a checkpoint for the same topic already exists, update it rather than creating a
   second one.

   **Ignore the folder locally.** Inside a repo, make sure `.agents/repobuddy/checkpoints/` is listed
   in `<git common dir>/info/exclude`, where the common dir is `git rev-parse --git-common-dir`, so the
   one entry covers every worktree. Append it only if no line already names it, and create the file if
   it is missing. Never add it to the tracked `.gitignore`: that would change the user's repo for a
   local note.

6. **Write each checkpoint** in the format below, in this order: **action first**, history after.
   When split, every checkpoint stands alone:
   - **Copy the shared context.** A working method or settled decision that applies to several topics
     goes into each of their checkpoints, in the lines that topic needs. Don't point at a sibling
     checkpoint for it: the sibling is deleted when its topic is done, and the reference would break.
   - **Record the order in `depends-on`.** If a topic can't start its `## NEXT` until another topic
     is done, list that topic's slug in `depends-on`, and say what it waits for in `## NEXT`. Leave
     the field out when the topics are independent. The dependency is met once the slug's checkpoint
     is gone, because a checkpoint is deleted when its work is done.

   Fill each checkpoint from what the session holds, so the cold reader gets it without rediscovery:
   - **Keep the user's words.** Under `## Goal`, quote the user's latest instruction for the topic
     word for word. Record each correction the user made ("don't touch X", "use Y instead") as a
     settled decision whose reason is "user said". `## NEXT` must follow from what the user asked
     for, not from an idea of the agent's own the user never agreed to.
   - **Record the dead ends.** An approach that was tried and failed goes under `## Dead ends`, with
     the evidence that sank it, so the next session doesn't try the obvious fix again.
   - **Describe a half-finished edit.** If the pause cuts a unit of work midway, `## NEXT` says what
     the partial change already does and what it still lacks, not only which files are dirty.
   - **Carry the todo list over.** Turn the harness's pending and in-progress todo items for the
     topic into `## Remaining steps`, in order, after the one in `## NEXT`.

7. **Apply the redaction floor.** Never write secrets, tokens, keys, passwords or personal data, even
   when the file stays local. Describe the class of thing ("the staging API key in 1Password"), not its
   value. With `--commit`, the file becomes public to anyone with the repo, so also leave out absolute
   paths, `$HOME`, OS usernames and hostnames. Use repo-relative paths.

8. **Leave the user's work alone.** Don't commit, stash or discard uncommitted changes to make the
   checkpoint tidy. List them under `## Not in git` in the checkpoint of the topic they belong to. If
   they need to reach another machine, say so in the reply and let the user decide how to carry them.

9. **Commit only with `--commit`.** By default the checkpoints are written and left uncommitted,
   because a note from a debugging session should not land on a feature branch by accident. With
   `--commit`, stage only the checkpoint files with `git add -f <path>...` (the folder is excluded, so
   a plain `git add` skips them) and commit them together as `docs: checkpoint <slug>[, <slug>...]`,
   so they follow the branch to another machine or another person.

   Before committing, check the redaction mechanically, since prose alone misses a path:

   ```sh
   grep -nE -e '/(home|Users)/' -e '[A-Za-z]:\\' -e "$HOME" -e "$(whoami)" -e "$(hostname)" <checkpoint>...
   ```

   Rewrite every real hit as a repo-relative path or a description, and don't commit until the check
   comes back clean. A match on a common word that happens to equal the username is not a leak.

10. **Report.** List every checkpoint written, each with its path, its `## NEXT` line and its
    `depends-on`, and say whether they were committed. Then list the topics skipped as done, one line
    each with the commit or PR that finished them, and any live topic left out by the focus or handed
    to `pause-mission`. If the split was decided without asking, say which option was taken and why. If
    there are uncommitted changes, say that they won't travel with an uncommitted checkpoint.

## Checkpoint format

```markdown
---
status: paused
focus: <the topic this checkpoint covers, or "whole frontier">
depends-on: [<slug of a topic that must finish first>]   # omit when independent
branch: <current branch, or none>
commit: <short HEAD sha at pause time, or none>
created: <ISO date>
updated: <ISO date>
---

# <Title of the work>

## NEXT — resume here

<One concrete, runnable action: the file or unit to touch and the command or skill to run.
Never "continue the work". If an edit is half done: what the partial change does, and what it lacks.>

## Goal

<What done looks like, in one or two lines.>

> <The user's latest instruction for this topic, quoted word for word.>

## Remaining steps

- <the step after ## NEXT, from the harness's todo list or the plan>

## Remaining topics

- <topic> — <its next action, once the one in ## NEXT is done>

## Settled decisions

- <decision> — <why, in one line, or "user said">. Do not reopen without new evidence.

## Dead ends

- <approach> — failed because <evidence>. Don't retry unless <condition>.

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
both, and "nothing" in `## Not in git` is itself information. So a checkpoint with no dead ends, no
remaining steps or no quotable instruction simply has no such section or line. `## Remaining topics`
appears only in a checkpoint kept as one over several topics.

## What a good checkpoint is not

- **Not a transcript.** Record decisions and the next action, not a play-by-play of the session. Quote
  the user's latest instruction, not the conversation; list a dead end as one line, not the story of
  the attempt.
- **Not a record of finished work.** A topic that is done is a commit or a PR, cited in one line where
  live work builds on it. It is not a section of its own.
- **Not a copy.** If something already lives in a commit, an ADR, a spec, an issue or a diff, reference
  it by path or URL and don't paste it.
- **Not buried.** The next action comes first. If a reader has to hunt for where to start, the pause
  failed.
- **Not self-referential.** Don't tell the reader to "run `resume-session`" or explain how to resume.
  Whoever opens the file is already past that point. Open `## NEXT` with the work itself.
- **Not final-sounding.** A pause is resumable. Keep the open questions and the live frontier explicit;
  don't smooth them into a summary that hides where to begin.
