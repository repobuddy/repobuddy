# session

Hand work between agent sessions. `pause` writes a checkpoint per topic that a fresh session can pick
up without going back over settled ground; `resume` picks one up and continues from its next step. A
topic that drifted into another repo is checkpointed in that repo, ready for a session started there.

## When to use

- "pause here, I'll pick this up tomorrow"
- "wrap up for now", "hand this off to another session"
- when the context window is filling up and you want a clean restart. Pause before the harness
  compacts on its own (Claude Code's auto-compact, for one): the skill can't trigger itself, and a
  compacted session has already lost detail the checkpoint would have kept
- "pick up where we left off", "resume the flaky-login-test work"
- a session in one repo wandered into work on another, and you want that work resumed over there

## Usage

```
/session pause [what the next session should focus on] [--commit]
/session resume [checkpoint slug or path | repo path]
/session help
```

Natural phrasing routes too: "let's stop here" pauses, "pick up the auth refactor" resumes. A bare
`/session` shows the help. The name differs from the `/resume` built into Claude Code, Codex, Copilot
CLI and Gemini CLI, so it doesn't collide with it.

## `pause`

1. Lists every request you made in the session, in order, including the ones it hasn't started, then
   sorts them into topics: independent threads such as a bug fix, a side refactor or a research
   question. Threads that share a goal or the same files stay one topic.
2. Skips work that is done. A committed fix or an answered question gets no checkpoint, only a
   one-line commit or PR reference where live work builds on it. Tangents with nothing left to do are
   dropped.
3. When more than one topic has work left, shows each one with its slug and next step and asks
   whether to write one checkpoint per topic or keep them in one, with a recommendation. With one live
   topic it doesn't ask. With a focus argument it checkpoints only that topic and names the others it
   left out. In a run with no one to ask, it takes the recommendation and says why.
4. Writes each checkpoint to `.agents/repobuddy/checkpoints/<slug>.md` at the root of the topic's
   **home repo**, the repo its work changes. That is usually the current repo; for a topic about
   another repo, the checkpoint goes into that repo, with its branch, commit and paths taken from
   there and a `repo:` field naming it. If that repo isn't on disk, it asks where it is (or, with no
   one to ask, falls back to `~/.agents/repobuddy/checkpoints/` and says so).

   The next action comes first, followed by the goal with your latest instruction quoted word for
   word, the remaining steps (carried over from the harness's todo list), settled decisions (your
   corrections among them, as "user said"), dead ends that shouldn't be retried, open questions,
   working method, the files, commits and issues touched, the state that isn't in git, and the skills
   the next session should use. A section with nothing to say is left out. Split checkpoints each
   stand alone: shared context is copied into each, and a topic that has to wait for another names it
   in `depends-on`, which `resume` shows as `waits on <slug>`.
5. On first use in a repo, adds the checkpoint folder to that repo's `.git/info/exclude` (shared by
   every worktree), not to your tracked `.gitignore`, so checkpoints never show up as untracked files.
6. Redacts secrets and personal data. With `--commit`, it also drops absolute paths, usernames and
   hostnames, and greps the checkpoints for them before committing.
7. Leaves your uncommitted work alone and lists it in the checkpoint, so you know it won't travel on
   its own.
8. Commits only the checkpoints, and only with `--commit`, staging them with `git add -f` past the
   exclude. It commits only in the current repo: a checkpoint written to another repo stays
   uncommitted, and the report says so.
9. Reports every checkpoint written with its next step, and the topics it skipped as done. For a
   checkpoint written to another repo, it gives the line to type to start a session there.

If a topic is an SDD mission, it hands that topic off to cyber-sdd's `pause-mission` (when installed),
which checkpoints into the mission's plan brief instead.

## `resume`

1. Finds the checkpoint in `.agents/repobuddy/checkpoints/`, including one a session in another repo
   paused here. It uses the one you named, or the only paused one. When several are paused, it lists
   them newest first, with title, branch and next step, and asks, even if one matches your current
   branch. A checkpoint that waits on another topic is marked `waits on <slug>`.
2. Checks the checkpoint against the repo. It says so first if the checkpoint's `repo:` names another
   repo, then flags a different branch, commits that landed since the pause, and state from
   `## Not in git` that isn't here.
3. Reloads the working method and the settled decisions, reads the dead ends so it doesn't retry a
   failed approach without new evidence, and raises any open question that blocks the next step.
4. Runs the next step, then the remaining steps, toward your quoted instruction, and keeps the
   checkpoint current as decisions are made.
5. Deletes the checkpoint once the work is done, not when it resumes. On resume it only marks the file
   `status: resumed`, so if the resumed session dies before pausing again, the state is still there.

Give it another repo's path instead (`/session resume ../other-repo`) and it lists that repo's paused
checkpoints, lets you pick, and hands back what to type to resume there. It never runs `cd` itself,
because a shell `cd` leaves the session on this repo's working directory, instructions, skills and
permissions.

| Harness | Moves the live session? | Hand-off |
| --- | --- | --- |
| Claude Code | Yes: `/cd` (v2.1.246+) | `/cd <repo>` then `/session resume <slug>`; fresh `claude` session as fallback |
| Codex CLI | Yes: `/cd` (0.150.0+) | `/cd <repo>` then `$session resume <slug>`; `codex -C <repo>` as fallback |
| Copilot CLI | Partly: `/cd` changes directory, but no instruction reload is documented | `/cd <repo>`, check `/env`, then `/session resume <slug>`; `copilot -C <repo> -i` as fallback |
| Gemini CLI | No (`/directory add` only adds a directory) | `cd <repo> && gemini -i "…"` |
| Cursor | No | `cd <repo> && agent "/session resume <slug>"`, or open the folder in the editor |

After an in-session move, the previous repo's conversation stays in context. Start a fresh session
instead if that conversation is long or unrelated. Each harness's exact lines, caveats and sources are
in [`references/harness/`](references/harness/).

With no checkpoint but an in-progress SDD mission plan, it hands off to cyber-sdd's `resume-mission`
(when installed).

## Why not `/resume` or `/handoff`?

Harness built-ins such as Claude Code's `/resume` and Gemini's `/chat save` restore a transcript in one
harness on one machine. A checkpoint records the state of the work, so another harness, another machine,
another repo or another person can read it. `/handoff` writes to the OS temp directory and has no resume
side.

## Install

```sh
npx skills add repobuddy/repobuddy --skill session
```
