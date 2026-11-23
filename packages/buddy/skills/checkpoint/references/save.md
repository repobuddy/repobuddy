# `checkpoint save`: pause a session into checkpoints

Arguments: `[<what the next session should focus on>] [--commit]`.

Write this session's unfinished work to checkpoint files so a fresh session, in any harness, on any
machine the files reach, can continue without going back over settled ground. Capture *enough to
continue, nothing to relitigate.* A session often holds more than one thread of work, so sort it by
topic first: finished work gets no checkpoint, and each live topic can get its own. A topic can belong
to another repo than the one this session runs in; its checkpoint then goes to that repo.

`checkpoint resume` is the matching reader, but each checkpoint must stand on its own. A session that only
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

   Then match each topic to the checkpoint it may already have, so a pause updates that file instead
   of writing a second one:
   - **By origin first.** If this session resumed checkpoint X, the topic it continued is X's topic,
     and writes back to X under X's slug.
   - **Otherwise by goal.** Before naming the topics, list the existing checkpoints of each topic's
     home repo with the listing command from step 1 of [list.md](list.md), with `--json` and that
     repo's path. Read each row's `path`, and reuse the slug of the one whose `## Goal` matches. When
     the match is unclear, ask. With no one to ask, give the topic a new slug and say so in the report.
   - **On a split.** When a matched topic has split in two, the part that continues the old `## Goal`
     keeps the slug, and the new part gets a new one.

2. **Drop finished and extra work.** A topic that is done (committed, merged, answered, or abandoned
   on purpose) gets no checkpoint and no history. If it matched a checkpoint in step 1, it should not
   linger or hold up a checkpoint whose `depends-on` names it, but ask before deleting it: list each
   such checkpoint with its slug and why its topic is done, and delete the ones the user agrees to.
   With no one to ask (a headless or scheduled run), keep them, and list them in the report as done
   and ready to delete. Delete each agreed one from the
   common dir with plain `rm`, and also delete its copy in the old folder (step 5), if there is one.
   When step 9 will commit the deletion (`--commit`, a committed checkpoint in the current repo),
   leave the committed copy to its `--drop`; otherwise use plain `rm`, so the deletion isn't staged
   into the user's next unrelated commit. Delete only for that reason: an old checkpoint can still be a legitimate
   pause, so age alone never is one. Where a live topic builds on the finished one, cite it in one line
   under `## Touched` (the commit sha or PR). Drop tangents that left nothing to do. Summarize only
   where a cold reader needs the gist to continue, never as a play-by-play of the session.

   If no topic has work left, write nothing: skip to step 9 for any deletion to commit, then report
   and stop.

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

5. **Pick the location.** Each topic has a **home repo**: the repo its work changes. It is usually the
   current repo, but a session in one repo can drift into work on another (a fix to a shared tool, a
   dependency, a sibling package), and that topic's checkpoint belongs where a session in *that* repo
   will look. When the topic's work changes files in one other repo, that repo is its home. When it
   spans two repos, split it if it splits cleanly; otherwise its home is the repo `## NEXT` acts in.
   - **Home is the current repo:** `<common dir>/repobuddy/checkpoints/<slug>.md`, where the common
     dir is `git rev-parse --path-format=absolute --git-common-dir`.
   - **Home is another repo on disk:** `<its common dir>/repobuddy/checkpoints/<slug>.md`, where the
     common dir is `git -C <path in that repo> rev-parse --path-format=absolute --git-common-dir`.
     Find the path from the session: files it read or edited there, or a path the user named.
   - **Home is another repo not found on disk:** ask the user where it is. With no one to ask, write to
     `~/.agents/repobuddy/checkpoints/<slug>.md` and say so in the report.
   - **No repo at all** (the session runs outside one and the topic has no home repo):
     `~/.agents/repobuddy/checkpoints/<slug>.md`.

   The common dir is the one git dir that every checkout of a repo shares: a plain clone, the main
   checkout and each linked worktree all resolve to it. So a checkpoint written from any of them is
   found from all of them, and removing or recycling a worktree, or `git clean -fdx`, leaves it alone.
   Being inside the git dir, it never shows in `git status` and needs no exclude entry. Never write
   the checkpoint into the working tree, except as the copy
   `--commit` makes (step 9).

   `<slug>` is a short kebab-case name for the topic (`flaky-login-test`, `auth-refactor`), not a
   timestamp. A topic matched in step 1 keeps its checkpoint's slug, and step 6 merges into that file.

   **Move a checkpoint from the old folder.** Earlier versions wrote checkpoints to
   `<checkout root>/.agents/repobuddy/checkpoints/` in the checkout itself (the root is
   `git rev-parse --show-toplevel`). When a topic matched a checkpoint there, step 6 merges into it and
   writes the result to the common dir. Then remove the old file with plain `rm`, unless git tracks it
   (`git ls-files --error-unmatch <path>` succeeds): a tracked copy is a committed one, which step 9
   updates with `--commit` and otherwise leaves as it is. Leave the old folder's exclude entry in
   `info/exclude` alone; it still covers the copies `--commit` makes.

   **Read the repo state from the checkout the session works in.** Take `branch` and `commit` from the
   home repo's checkout (`git -C <checkout root> branch --show-current` and `rev-parse --short HEAD`),
   take `## Not in git` from its `git status --short`, and write every path relative to its root. Set
   `repo:` to the home repo's `origin` remote (`owner/name`), or, with no `origin`, to the folder name
   of its main checkout (the first `worktree` line of `git worktree list --porcelain`), never an
   absolute path and never a linked worktree's folder name, so a resume from any checkout can tell
   whose checkpoint it is. The `branch` is how `resume` finds the checkout to continue in.

6. **Write each checkpoint** in the format below, in this order: **action first**, history after.
   Write the file with the skill's script, the whole text on stdin, never with a file tool, because
   some harnesses' file tools refuse to write under `.git/`:

   ```sh
   node <this-skill-dir>/scripts/repobuddy.mjs checkpoint write <slug> [<path in its home repo>] [--home] <<'CHECKPOINT'
   <the checkpoint>
   CHECKPOINT
   ```

   Pass the path for a home repo other than the current one, and `--home` for
   `~/.agents/repobuddy/checkpoints/`. It creates the folder, prints the path it wrote, and exits 2,
   writing nothing, when the slug is not kebab-case or the text lacks the front matter, `## NEXT` or
   `## Not in git`: fix the text and run it again.

   When split, every checkpoint stands alone:
   - **Copy the shared context.** A working method or settled decision that applies to several topics
     goes into each of their checkpoints, in the lines that topic needs. Don't point at a sibling
     checkpoint for it: the sibling is deleted when its topic is done, and the reference would break.
   - **Record the order in `depends-on`.** If a topic can't start its `## NEXT` until another topic
     is done, list that topic's slug in `depends-on`, and say what it waits for in `## NEXT`. Leave
     the field out when the topics are independent. The dependency is met once the slug's checkpoint
     is gone, because a checkpoint is deleted when its work is done.

   **Merge into a matched checkpoint; don't overwrite it.** A full rewrite drops what this session
   never touched. Read the file first and keep `created`, the settled decisions and the dead ends; a
   dead end stays unless this session reopened it with evidence. If the file has a `resumed:` block,
   compare its `at` with the one this session wrote on resume. If they differ, or this session wrote
   none, warn that another session resumed the file in the meantime, and ask before overwriting; with
   no one to ask, merge and say so in the report. Then remove the block: a paused file is not resumed.
   Rewrite `## NEXT`, `## Remaining steps`, `## Not in git`, `branch`, `commit` and `updated` from the
   current state, add this session's finished parts to `## Done so far` and its new decisions, dead ends
   and open questions, and drop the questions it answered.

   Fill each checkpoint from what the session holds, so the cold reader gets it without rediscovery:
   - **Keep the user's words.** Under `## Goal`, quote the user's latest instruction for the topic
     word for word. Record each correction the user made ("don't touch X", "use Y instead") as a
     settled decision whose reason is "user said". `## NEXT` must follow from what the user asked
     for, not from an idea of the agent's own the user never agreed to.
   - **Say what the work is and how far it got.** Open `## Goal` with what the work is, why it
     exists and what done looks like, in plain words a reader who never saw the session follows. List
     under `## Done so far` the parts of the goal already finished, one line each with its commit or
     PR. These are what `resume` opens its summary with, so name outcomes, not mechanics such as
     rebases or renamed commits.
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
   `--commit`, commit copies of them so they follow the branch to another machine or another person,
   from the current checkout:

   ```sh
   node <this-skill-dir>/scripts/repobuddy.mjs checkpoint commit [<slug>...] [--drop <slug>...]
   ```

   Name each checkpoint written to the current repo, and pass `--drop <slug>` for each committed copy
   step 2 deletes. Pass `--message <msg>` with a message in the repo's commit convention, read from
   its contributing guide, commit hooks or recent `git log`; leave it out only when the repo has none. It copies each checkpoint from the common dir to
   `.agents/repobuddy/checkpoints/<slug>.md`, since a file in the git dir cannot be committed as it
   is, removes each dropped copy, and commits only those paths under that message, by default
   `docs: checkpoint <slug>[, <slug>...]`, or `docs: drop checkpoint <slug>[, <slug>...]` with drops
   alone. The user's staged and unstaged work stays out of the commit. It prints the commit and its
   message. The copy in the common dir stays the one `list` and `resume` read here; the committed
   copy is for a checkout that has no common-dir copy, such as a clone on another machine.

   Before it commits, it checks the copies for absolute paths, the home folder, the user name and the
   host name. On a hit it prints each line, commits nothing, and exits 1: rewrite the checkpoint as
   repo-relative paths or descriptions with `checkpoint write`, and run it again. A hit on a common
   word that happens to equal the user name or host name is not a leak: pass it with
   `--allow <word>`.

   `--commit` covers only checkpoints written to the current repo. A checkpoint written to another
   repo (or to `~/.agents/repobuddy/checkpoints/`), or deleted there, stays uncommitted: committing
   there would put a note on a branch in a repo this session was not asked to change. The report says
   so.

10. **Report.** List every checkpoint written, each with its path, whether it is new or updated, its
    `## NEXT` line and its `depends-on`, and say whether they were committed. Then list the topics
    skipped as done, one line each with the commit or PR that finished them and the checkpoint deleted
    for it, if any, saying when that deletion is uncommitted, or kept because no one could confirm it, and any live topic left out by the focus or handed to `pause-mission`. If the split
    was decided without asking, say which option was taken and why. If a topic got a new slug because
    its match to an existing checkpoint was unclear, name both. If there are uncommitted changes, say
    that they won't travel with an uncommitted checkpoint.

    For each checkpoint written to the current repo, give the line the user types in a new session here
    to resume it: `<command> resume <slug>`, with `<command>` from [command.md](command.md).

    For each checkpoint written to another repo, name that repo and say it was left uncommitted, then
    give the line the user types to resume it there. Load only the reference for the current harness
    and use its hand-off lines, with `<repo-root>` as that repo's root and `<slug>` as the checkpoint's:
    [Claude Code](harness/claude-code.md), [Codex](harness/codex.md),
    [Gemini CLI](harness/gemini.md), [Copilot CLI](harness/copilot.md),
    [Cursor](harness/cursor.md). For any other harness, give the fresh-session form: `cd <repo-root>`,
    then start the harness with a prompt that runs `<command> resume <slug>`. For a checkpoint that fell
    back to `~/.agents/repobuddy/checkpoints/`, give its path instead, to pass to `<command> resume` from
    a session in the home repo.

## Checkpoint format

```markdown
---
focus: <the topic this checkpoint covers, or "whole frontier">
depends-on: [<slug of a topic that must finish first>]   # omit when independent
repo: <home repo's root folder name or origin owner/name; never an absolute path; omit when there is no repo>
branch: <home repo's current branch, or none>
commit: <home repo's short HEAD sha at pause time, or none>
created: <ISO date>
updated: <ISO date>
resumed:                        # optional; written only by `resume`, removed by `save`
  at: <UTC timestamp>
  harness: <harness name>
  session: <harness session id>
  pid: <harness process id>     # omit where the harness exposes none
  started: <that process's start time>
---

# <Title of the work>

## NEXT — resume here

<One concrete, runnable action: the file or unit to touch and the command or skill to run.
Never "continue the work". If an edit is half done: what the partial change does, and what it lacks.>

## Goal

<What the work is, why it exists, and what done looks like, in one or two lines.>

> <The user's latest instruction for this topic, quoted word for word.>

## Done so far

- <a finished part of the goal, in one line> — <its commit sha or PR>

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
  live work builds on it. It is not a section of its own. `## Done so far` lists the finished parts of
  a live topic, one line each, not the story of how they were done.
- **Not a copy.** If something already lives in a commit, an ADR, a spec, an issue or a diff, reference
  it by path or URL and don't paste it.
- **Not buried.** The next action comes first. If a reader has to hunt for where to start, the pause
  failed.
- **Not self-referential.** Don't tell the reader to "run `checkpoint resume`" or explain how to resume.
  Whoever opens the file is already past that point. Open `## NEXT` with the work itself.
- **Not final-sounding.** A pause is resumable. Keep the open questions and the live frontier explicit;
  don't smooth them into a summary that hides where to begin.

## Done when

- **C2.** Each live topic of the current repo has one checkpoint at
  `<common dir>/repobuddy/checkpoints/<slug>.md`, with a `## NEXT` and a `## Not in git` section, and no checkpoint
  was written for a finished topic.
- **C3.** Without `--commit`, no commit was made, and `git status` shows the user's uncommitted work as it was and no
  new file in the working tree.
- **C4.** With `--commit`, one new commit holds only the copies under `.agents/repobuddy/checkpoints/`, and none of
  them holds an absolute path such as `/home/<user>/`.
- **C5.** The report names each checkpoint written and gives the `<command> resume <slug>` line for it.
- **C12.** A finished topic's existing checkpoint was deleted only after the user agreed to it. Without that answer it
  still exists, and the reply names it as done and asks to delete it, or says it was kept as ready to delete.
- **C13.** With `--commit`, the commit's subject follows the repo's commit convention.
