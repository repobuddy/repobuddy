# checkpoint

Hand work between agent sessions. `save` writes a checkpoint per topic that a fresh session can pick
up without going back over settled ground; `resume` picks one up and continues from its next step. A
topic that drifted into another repo is checkpointed in that repo, ready for a session started there.

## Research

Skipped: written before the research step. The harness built-ins it differs from are compared under
[Why not `/resume` or `/handoff`?](#why-not-resume-or-handoff).

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
/checkpoint save [<what the next session should focus on>] [--commit]
/checkpoint resume [<checkpoint slug> | <path> | <repo path>]
/checkpoint list [<repo path>]
/checkpoint help
```

Type the skill's name the way your harness invokes it. The lines above use `/checkpoint`, which is right
for a Skills CLI install in Copilot CLI and the Cursor editor:

| Harness | From the repobuddy plugin | Installed by the Skills CLI |
| --- | --- | --- |
| Claude Code | `/repobuddy:checkpoint` (pnpm install: `pnpm-repobuddy-checkpoint`) | ask in words ("use the checkpoint skill to resume …"): `/checkpoint` is an alias of the built-in `/rewind` |
| Codex CLI | `$repobuddy:checkpoint` | `$checkpoint` |
| Copilot CLI | ask in words (namespacing not documented) | `/checkpoint` |
| Cursor | ask in words (namespacing not documented) | `/checkpoint` in the editor's Agent chat; ask in words in the `agent` CLI |
| Gemini CLI | — | ask in words |

The skill hands back lines in the same form. Sources are in [`references/command.md`](references/command.md).

Natural phrasing routes too: "let's stop here" saves a checkpoint, "pick up the auth refactor" resumes, "what checkpoints do I have" lists them. A bare
`/checkpoint` runs `resume` in a new or just-cleared session, since there is no work to `save` from. In a
session that resumed or wrote exactly one checkpoint and has not strayed from its goal, it updates that
checkpoint, with no prompt and no new file. A session that drifted across topics, or touched several
checkpoints, runs `save` when the repo has no checkpoint yet and shows the help when it has some.
The name differs from the `/resume` built into Claude Code, Codex, Copilot
CLI and Gemini CLI. In Claude Code the bare `/checkpoint` is still taken by `/rewind`, hence the table.

## Keep a checkpoint current automatically

The skill can't wake itself, but Claude Code can run it on a schedule, and a bare invocation in a
one-checkpoint session needs no answer, so it runs unattended.

- **On an interval or when idle: `/loop`.** In a session on one checkpoint, type
  `/loop 20m /repobuddy:checkpoint`. The prompt fires every 20 minutes while the session is idle, and each
  firing updates the checkpoint. Without an interval, `/loop /repobuddy:checkpoint` lets the model pace
  itself with a scheduled wakeup. The loop lives only as long as the session.
- **After each turn: a `Stop` hook.** A hook runs a shell command, not a skill, so it can only ask the
  model to run the skill. Add this to `.claude/settings.local.json`; the command prints the block
  decision once per turn and lets the following stop through:

  ```json
  {
    "hooks": {
      "Stop": [
        {
          "hooks": [
            {
              "type": "command",
              "command": "jq -e '.stop_hook_active' >/dev/null && exit 0; echo '{\"decision\":\"block\",\"reason\":\"Run /repobuddy:checkpoint to update this session checkpoint.\"}'"
            }
          ]
        }
      ]
    }
  }
  ```

  This costs a model turn after every reply, so prefer `/loop` unless you want an update each turn.
  A `PreCompact` hook the same way saves state just before auto-compact.
- Other harnesses: use their own scheduler or hook to submit the same bare prompt, where they have one.

Both only work in a session that matches the update rule; in a drifted session the bare call asks
instead, which stalls an unattended run.

## `save`

1. Lists every request you made in the session, in order, including the ones it hasn't started, then
   sorts them into topics: independent threads such as a bug fix, a side refactor or a research
   question. Threads that share a goal or the same files stay one topic.
   Each topic is matched to the checkpoint it may already have: the one this session resumed, or one
   whose goal matches (it asks when unclear). A matched topic keeps that slug; when a topic split, the
   part that continues the old goal keeps it.
2. Skips work that is done. A committed fix, an answered question or a topic you abandoned gets no
   checkpoint, only a one-line commit or PR reference where live work builds on it, and its old
   checkpoint, if it had one, is deleted once you agree; with no one to ask, it is kept and reported as
   ready to delete. Age alone never deletes a checkpoint. Tangents with nothing
   left to do are dropped.
3. When more than one topic has work left, shows each one with its slug and next step and asks
   whether to write one checkpoint per topic or keep them in one, with a recommendation. With one live
   topic it doesn't ask. With a focus argument it checkpoints only that topic and names the others it
   left out. In a run with no one to ask, it takes the recommendation and says why.
4. Writes each checkpoint to `<common git dir>/repobuddy/checkpoints/<slug>.md` of the topic's
   **home repo**, the repo its work changes. The common git dir (`git rev-parse --git-common-dir`) is
   shared by a plain clone, the main checkout and every linked worktree, so a checkpoint written in
   one is seen from all of them, and removing a worktree or running `git clean -fdx` doesn't delete
   it. That is usually the current repo; for a topic about
   another repo, the checkpoint goes into that repo, with its branch, commit and paths taken from
   there and a `repo:` field naming it. If that repo isn't on disk, it asks where it is (or, with no
   one to ask, falls back to `~/.agents/repobuddy/checkpoints/` and says so). An existing checkpoint
   is merged, not overwritten: its settled decisions and dead ends stay, and the next step, remaining
   steps, branch, commit and uncommitted state are rewritten.

   The next action comes first, followed by the goal (what the work is, why, and what done looks
   like) with your latest instruction quoted word for word, what is done so far, the remaining steps (carried over from the harness's todo list), settled decisions (your
   corrections among them, as "user said"), dead ends that shouldn't be retried, open questions,
   working method, the files, commits and issues touched, the state that isn't in git, and the skills
   the next session should use. A section with nothing to say is left out. Split checkpoints each
   stand alone: shared context is copied into each, and a topic that has to wait for another names it
   in `depends-on`, which `resume` shows as `waits on <slug>`.
5. Never touches your working tree or `.gitignore`: the checkpoints sit in the git dir, so they
   never show up in `git status`. A checkpoint an earlier version wrote to
   `.agents/repobuddy/checkpoints/` in the checkout is moved to the git dir the next time its topic is
   checkpointed.
6. Redacts secrets and personal data. With `--commit`, it also drops absolute paths, usernames and
   hostnames, and greps the checkpoints for them before committing.
7. Leaves your uncommitted work alone and lists it in the checkpoint, so you know it won't travel on
   its own.
8. Commits only the checkpoints, and only with `--commit`: it copies them to
   `.agents/repobuddy/checkpoints/` in the checkout and commits the copies with `git add -f`, because
   that folder may be excluded, with a message in the repo's commit convention. The commit lets them follow the branch to another machine. It commits only in the current repo: a checkpoint written to another repo stays
   uncommitted, and the report says so.
9. Reports every checkpoint written with its next step, and the topics it skipped as done. For a
   checkpoint written to another repo, it gives the line to type to start a session there.

If a topic is an SDD mission, it hands that topic off to cyber-sdd's `pause-mission` (when installed),
which checkpoints into the mission's plan brief instead.

## No `update`

`save` is the update; a bare invocation in a one-checkpoint session runs it for you. A topic that matches an existing checkpoint is merged into it, and `resume` keeps
the checkpoint current as it works. "Update the checkpoint" routes to `save`.

## `list`

Shows the checkpoints and stops. It never opens or continues one. It runs `buddy checkpoint list` through the
skill's `scripts/repobuddy.mjs`, so the folders, order and liveness check are the same on every run. It covers the checkpoints in this
repo's common git dir, a committed or older copy in this checkout's `.agents/repobuddy/checkpoints/`,
and the checkpoints in `~/.agents/repobuddy/checkpoints/` whose `repo:` names this repo; outside a repo, the home folder; given a repo path, that repo's checkpoints, with no
hand-off and no `cd`. Rows are newest first, each with title, branch and the worktree it is checked out in, `updated` date, next step,
`waits on <slug>` and, for a resumed checkpoint, whether its session is still alive. With none, it says so
and stops. `resume` uses the same listing when it asks which one to open.

## `resume`

1. Finds the checkpoint in the repo's common git dir, from whichever checkout you are in, including
   one a session in another repo paused here. It uses the one you named, or the only one there. When there are several, it lists
   them newest first, with title, branch and next step, and asks, even if one matches your current
   branch. A checkpoint that waits on another topic is marked `waits on <slug>`.
2. Opens with a short summary of the work before any action: what it is and its goal, what is done,
   what is left, and the next step, with any open question waiting on you. Rebase state, commit ids
   and the resume marker stay out of it, and come after it in a line or two when they matter. A
   checkpoint written before `## Done so far` existed still resumes; the summary draws what is done
   from the commits it cites.
3. Checks the checkpoint against the repo. It says so first if the checkpoint's `repo:` names another
   repo. Then it goes by the checkpoint's branch: on that branch, it continues here; with the branch
   checked out in another worktree, it names that worktree, gives the line to resume there, and
   stops; with the branch checked out nowhere, it says so and stops, leaving how to check it out
   (`git switch`, a new worktree) to you. It never switches branches itself. It then flags commits
   that landed since the pause, and state from
   `## Not in git` that isn't here. If the new commits already met the goal, it asks whether to delete
   the checkpoint instead of continuing.
4. Reloads the working method and the settled decisions, reads the dead ends so it doesn't retry a
   failed approach without new evidence, and raises any open question that blocks the next step.
5. Runs the next step, then the remaining steps, toward your quoted instruction, and keeps the
   checkpoint current as decisions are made.
6. Writes a `resumed:` marker (time, harness, session id, process id and start time) into the checkpoint.
   The list warns about a marked checkpoint, checking whether its process is still alive, and asks
   before opening one that is alive or can't be checked. The marker never hides a checkpoint. `save`
   removes it on the next pause, and warns first if another session resumed the file in the meantime.
7. Asks to delete the checkpoint once the work is done, not when it resumes, so if the resumed
   session dies before pausing again, the state is still there. With no one to ask, it keeps it.

Give it another repo's path instead (`/checkpoint resume ../other-repo`) and it lists that repo's
checkpoints, lets you pick, and hands back what to type to resume there. It never runs `cd` itself,
because a shell `cd` leaves the session on this repo's working directory, instructions, skills and
permissions.

| Harness | Moves the live session? | Hand-off |
| --- | --- | --- |
| Claude Code | Yes: `/cd` (v2.1.246+) | `/cd <repo>` then `/repobuddy:checkpoint resume <slug>`; fresh `claude` session as fallback |
| Codex CLI | Yes: `/cd` (0.150.0+) | `/cd <repo>` then `$repobuddy:checkpoint resume <slug>`; `codex -C <repo>` as fallback |
| Copilot CLI | Partly: `/cd` changes directory, but no instruction reload is documented | `/cd <repo>`, check `/env`, then `/checkpoint resume <slug>` (Skills CLI install); `copilot -C <repo> -i` as fallback |
| Gemini CLI | No (`/directory add` only adds a directory) | `cd <repo> && gemini -i "…"` |
| Cursor | No | `cd <repo> && agent "Use the checkpoint skill to resume <slug>"`, or open the folder in the editor and type `/checkpoint resume <slug>` (Skills CLI install) |

The table shows the plugin form where it is known. Each row's command follows the table under
[Usage](#usage). After an in-session move, the previous repo's conversation stays in context. Start a fresh session
instead if that conversation is long or unrelated. Each harness's exact lines, caveats and sources are
in [`references/harness/`](references/harness/).

With no checkpoint but an in-progress SDD mission plan, it hands off to cyber-sdd's `resume-mission`
(when installed).

## Worktrees and other tooling

Checkpoints work the same in a plain clone, the main checkout and a linked worktree, and the skill
assumes none of them. A checkpoint belongs to the repo, and its branch says where to continue.

The skill reports where the branch is and doesn't go there. When the branch is checked out somewhere
else, `resume` stops with `Branch <branch> is checked out at <path>.`; when no worktree has it, it
stops with `Branch <branch> is not checked out in any worktree of this repo.`. A tool that manages
sessions or worktrees can act on those lines from its own side, for example to move to the pane
working in `<path>` or to create the worktree. The skill depends on no such tool.

## Why not `/resume` or `/handoff`?

Harness built-ins such as Claude Code's `/resume` and Gemini's `/chat save` restore a transcript in one
harness on one machine. A checkpoint records the state of the work, so another harness, another machine,
another repo or another person can read it. `/handoff` writes to the OS temp directory and has no resume
side.

## Install

```sh
npx skills add repobuddy/repobuddy --skill checkpoint
```
