---
name: resume-session
description: "Use this skill when resuming paused work from a checkpoint — continues from its next step without relitigating."
argument-hint: "[checkpoint slug or path | repo path]"
---

# Resume a session from its checkpoint

Pick up work that `pause-session` checkpointed: find the checkpoint, reload its context, and continue
from its `## NEXT` without going back over what it records as settled.

## Procedure

1. **Find the checkpoint.** Checkpoints live in `<repo root>/.agents/repobuddy/checkpoints/` (the
   repo root is `git rev-parse --show-toplevel`), or in `~/.agents/repobuddy/checkpoints/` outside a
   repo. Take the first rule that matches:
   1. The user gave a checkpoint path or slug: open that one.
   2. The user gave the path of another repo: go to step 1a.
   3. Exactly one checkpoint has `status: paused`: open it.
   4. More than one has `status: paused`: list only those, newest `updated` first, each with its
      title, branch and `## NEXT` line, and ask which one to resume. Ask even when one of them
      matches the current branch; a branch match is a hint to mention, not a choice to make.

   **1a. Another repo.** List that repo's paused checkpoints (root from
   `git -C <repo-path> rev-parse --show-toplevel`) the same way and let the user pick, even if only
   one is paused. Then stop and hand back the command that starts a fresh session there:
   - Claude Code: `cd <repo-root> && claude "/resume-session <slug>"`
   - Codex: `cd <repo-root> && codex "resume-session <slug>"`
   - Gemini CLI: `cd <repo-root> && gemini -i "resume-session <slug>"`
   - Copilot CLI: `cd <repo-root> && copilot -i "resume-session <slug>"`

   Give the one for the current harness first. Don't `cd` there and continue in this session: the
   harness would still run with this repo's working directory, AGENTS.md, skills and permissions.

   **If none is paused** but one has `status: resumed`, the session that resumed it may have ended
   without pausing again. Name it and ask before opening it.

   **If there is no checkpoint** but an `.agents/plans/*.plan.md` has todos `in_progress`, the work is
   an SDD mission. Use `resume-mission` if it is available, or read that plan's `## NEXT` yourself.
   If there is neither, say so and stop. Don't reconstruct a checkpoint from guesses.

2. **Read it in full, then check it against the repo.** Compare the checkpoint's `branch` and `commit`
   with the current ones:
   - On a different branch: say so, and ask before switching, because switching branches can disturb
     the user's work.
   - The branch has moved past `commit`: read `git log <commit>..HEAD --oneline` and check whether
     the new commits already did the `## NEXT` step or changed a settled decision.
   - Any `## Not in git` item that is missing here, such as uncommitted changes from another machine
     or a process that is no longer running: name it before going on.

3. **Mark it resumed, don't delete it.** Set `status: resumed` and update `updated`. The file stays
   until the goal is met: deleting it now would lose the state if this session dies before it pauses
   again.

4. **Reload the working method and the settled decisions.** Treat `## Settled decisions` as settled.
   Reopen one only on new evidence, and say that you are reopening it and why. Follow
   `## Working method` instead of working out the conventions again. Load the skills that
   `## Suggested skills` names when you reach the step that needs them.

5. **Surface the open questions that block the next action.** If an item in `## Open questions` has
   to be answered before `## NEXT` can run, raise it before going further. Don't guess past it.

6. **Do the `## NEXT` action, then keep going.** Read only the context that action needs: the files
   and references in `## Touched` that it uses, not all of them. Work in the checkpoint's rhythm,
   committing each coherent unit as the repo's conventions require.

7. **Keep the checkpoint current while it exists.** When a decision is settled or a question
   resolved, update the checkpoint, so that an interruption leaves a resumable file behind.

8. **Delete it when the work is done.** A checkpoint is a handoff, not a record. Once its goal is met,
   move anything worth keeping into a commit message, an ADR or an issue, then delete the file. Use
   `git rm` if it was committed, and commit the deletion along with the work's final unit. If the
   session ends before the goal is met, run `pause-session` to rewrite `## NEXT` instead of leaving a
   stale one behind.
