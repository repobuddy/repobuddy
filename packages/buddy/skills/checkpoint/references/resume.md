# `checkpoint resume`: resume a session from its checkpoint

Arguments: `[checkpoint slug or path | repo path]`.

Pick up work that `checkpoint create` checkpointed: find the checkpoint, reload its context, and continue
from its `## NEXT` without going back over what it records as settled. The checkpoint may have been
paused from a session in another repo: `checkpoint create` writes each topic to its home repo, so a topic
that drifted in elsewhere is already here.

## Procedure

1. **Find the checkpoint.** Checkpoints live in `<repo root>/.agents/repobuddy/checkpoints/` (the
   repo root is `git rev-parse --show-toplevel`), or in `~/.agents/repobuddy/checkpoints/` outside a
   repo. Inside a repo, also count the checkpoints in `~/.agents/repobuddy/checkpoints/` whose `repo:`
   names this repo: a pause that couldn't find this repo on disk left them there. Take the first rule
   that matches:
   1. The user gave a checkpoint path or slug: open that one.
   2. The user gave the path of another repo: go to step 1a.
   3. Exactly one checkpoint exists: open it.
   4. More than one exists: list them, newest `updated` first, each with its title, branch,
      `updated` date and `## NEXT` line, and ask which one to resume. Ask even when one of them
      matches the current branch; a branch match is a hint to mention, not a choice to make. Mark
      a checkpoint whose `depends-on` names a checkpoint that still exists as `waits on <slug>`.
      Annotate each checkpoint that carries a `resumed:` block with its liveness answer (see
      **Resume marker**). The marker only annotates: never hide, skip or block a checkpoint because
      of it.

   **1a. Another repo.** List that repo's checkpoints (root from
   `git -C <repo-path> rev-parse --show-toplevel`) the same way and let the user pick, even if only
   one exists. Then hand back what the user types to resume there, and stop. Never `cd` there
   yourself and continue: a shell `cd` leaves the harness on this repo's working directory,
   AGENTS.md, skills and permissions.

   Where the harness has a command that moves the session itself (only the user can run it), give
   those in-session lines first, and say the previous repo's conversation stays in context. Otherwise,
   or as the fallback, give the command that starts a fresh session in that repo. A command that only
   adds a readable directory doesn't count as a move. The exact lines are in the reference for the
   current harness. Load only that one:
   [Claude Code](harness/claude-code.md), [Codex](harness/codex.md),
   [Gemini CLI](harness/gemini.md), [Copilot CLI](harness/copilot.md),
   [Cursor](harness/cursor.md). For any other harness, give the fresh-session form: `cd <repo-root>`,
   then start the harness with a prompt that runs `checkpoint resume <slug>`.

   **If there is no checkpoint** but an `.agents/plans/*.plan.md` has todos `in_progress`, the work is
   an SDD mission. Use `resume-mission` if it is available, or read that plan's `## NEXT` yourself.
   If there is neither, say so and stop. Don't reconstruct a checkpoint from guesses.

2. **Read it in full, then check it against the repo.** First compare the checkpoint's `repo:` with
   the current repo (its root folder name and its `origin` remote). If they differ, say so before
   going on: the `branch`, `commit` and paths in the checkpoint belong to that repo, so the checks
   below would run against the wrong history. If the user means to resume it there, hand back the
   lines from step 1a and stop; otherwise ask how to go on. A checkpoint with no `repo:` predates the
   field: treat it as this repo's. Then compare the checkpoint's `branch` and `commit` with the
   current ones:
   - On a different branch: say so, and ask before switching, because switching branches can disturb
     the user's work.
   - The branch has moved past `commit`: read `git log <commit>..HEAD --oneline` and check whether
     the new commits already did the `## NEXT` step or changed a settled decision. If they already
     met the goal, ask whether to delete the checkpoint (step 7) instead of continuing.
   - Its `depends-on` names a checkpoint that still exists: that topic isn't done yet. Say so, and
     ask whether to resume that one first.
   - Any `## Not in git` item that is missing here, such as uncommitted changes from another machine
     or a process that is no longer running: name it before going on.

   Once the checks pass and the user has agreed to go on, **write the marker**: add this block to the
   front matter (replacing an older one) and remember its `at`, so `create` can tell whether another
   session resumed the file since:

   ```yaml
   resumed:
     at: 2026-11-02T10:15:00Z      # UTC, now
     harness: claude-code
     session: <harness session id>
     pid: <harness process id>
     started: <that process's start time, from ps -o lstart= -p <pid>>
   ```

   Take `session` and `pid` from the harness reference. Where the harness exposes no PID, write only
   `harness` and `session`; that reads as unknown. Write no hostname, username or machine id. On a
   committed checkpoint, commit the marker with the first unit of work, not in a separate commit.

   **Resume marker.** A `resumed:` block in the front matter says a session resumed the file and has
   not paused it since. Work out one of three answers for it:
   - **alive:** the PID exists, its process is that harness, and its start time matches. Show "open in
     session `<session>`" and ask before opening it.
   - **dead:** the PID is gone, or its start time or harness does not match. Open it without asking.
   - **unknown:** anything that cannot be checked, such as no `pid` or `started`, an unknown harness
     process name, or a PID check that fails. List it with the warning "resumed `<age>` ago, not
     paused since: it may be open in another session, or that session ended", and ask before opening
     it. Never treat unknown as dead.

   Check the process with `ps -o lstart= -p <pid>` (compare with `started`) and the harness's process
   name from its [harness reference](harness/claude-code.md). If the committed version of the file
   carries the block (`git show HEAD:<path>` contains `resumed:`), it may have come from another
   machine, such as a cloud agent: answer unknown and skip the PID check.

3. **Reload the working method and the settled decisions.** Treat `## Settled decisions` as settled.
   Reopen one only on new evidence, and say that you are reopening it and why. Follow
   `## Working method` instead of working out the conventions again. Load the skills that
   `## Suggested skills` names when you reach the step that needs them.

   Read `## Dead ends` before acting. Don't retry an approach listed there unless you have the
   evidence or the condition it names, and say so when you do. A settled decision whose reason is
   "user said" is the user's own call: reopen it only by asking the user.

4. **Surface the open questions that block the next action.** If an item in `## Open questions` has
   to be answered before `## NEXT` can run, raise it before going further. Don't guess past it.

5. **Do the `## NEXT` action, then keep going** through `## Remaining steps`, in order, toward the
   instruction quoted under `## Goal`. Read only the context each action needs: the files and
   references in `## Touched` that it uses, not all of them. Work in the checkpoint's rhythm,
   committing each coherent unit as the repo's conventions require.

6. **Keep the checkpoint current while it exists.** When a decision is settled or a question
   resolved, update the checkpoint, so that an interruption leaves a resumable file behind.

7. **Delete it when the work is done, not before.** A checkpoint is a handoff, not a record, but
   until the goal is met it is what survives if this session dies. Once the goal is met, move
   anything worth keeping into a commit message, an ADR or an issue, then delete the file. Use
   `git rm` if it was committed, and commit the deletion along with the work's final unit. Age is no
   reason to delete one: an old checkpoint can still be a legitimate pause. If the session ends before
   the goal is met, run `checkpoint create`, which writes back to this checkpoint and rewrites its
   `## NEXT`, instead of leaving a stale one behind.
