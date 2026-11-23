---
title: buddy checkpoint
description: List the checkpoints the checkpoint skill reads, newest first, with branch, next step, and resume liveness.
---

`buddy checkpoint list` lists a repository's checkpoints for the [`checkpoint` skill](/repobuddy/skills/checkpoint/).
The skill's `list` subcommand runs it and shows its output, and `resume` runs it when it has to ask which checkpoint
to open. It reads files and git state and writes nothing.

## Usage

```sh
buddy checkpoint list [<repo path>] [--json]
```

## Arguments

| Argument | Type | Default | Effect |
| --- | --- | --- | --- |
| `<repo path>` | path | the current directory | A path in the repository to list. |
| `--json` | boolean | off | Prints the listing as JSON instead of text. |

## Behavior

- Inside a git repository, or given a path in one, it reads three folders:
  - `<common git dir>/repobuddy/checkpoints/`, shared by every checkout of the repository.
  - `.agents/repobuddy/checkpoints/` in the checkout. Rows from it say `in this checkout`.
  - `~/.agents/repobuddy/checkpoints/`, keeping only checkpoints whose `repo:` names the repository: its `origin`
    `owner/name`, the folder name of its main checkout, or the folder name of the checkout.
- Outside a repository, it reads only `~/.agents/repobuddy/checkpoints/`.
- A slug found in more than one folder is listed once, from the copy with the newest `updated`. On a tie the common
  git dir's copy wins. The row names the other copies as older.
- Rows are sorted by `updated`, newest first.
- Each row has the title, the slug, the `branch` and where it is checked out (`here`, another worktree's path, or
  `not checked out`), the `updated` date, and the first line under `## NEXT`.
- `waits on <slug>` appears for each `depends-on` slug that still has a checkpoint.
- For a checkpoint with a `resumed:` block, it adds a liveness note:
  - **alive**: the recorded `pid` runs the harness's process and started at the recorded `started` time. The note
    says `open in session <session>`.
  - **dead**: the process is gone, runs another program, or started at another time.
  - **unknown**: the marker has no `pid` or `started`, the harness's process name is not known, `ps` fails, or the
    committed copy of the file carries the marker. Unknown is never read as dead.

  The marker only annotates a row. No checkpoint is hidden because of it.

## Output

```
Fix the flaky login test (flaky-login-test)
  branch: fix/login, here
  updated: 2026-11-20
  next: Run `pnpm test login.spec.ts` and read the second failure.
  waits on auth-refactor
  resumed 3h ago, not paused since: it may be open in another session, or that session ended (no pid or start time)
```

With no checkpoints, it prints `No checkpoints in <folders>.` and exits `0`.

With `--json`, stdout is an object with `repo` (`null` outside a repository), `folders`, and `checkpoints`. Each
checkpoint carries `slug`, `title`, `path`, `folder`, `branch`, `checkedOut`, `updated`, `next`, `dependsOn`,
`waitsOn`, `liveness`, and `olderCopies`.

## Exit codes

| Code | When |
| --- | --- |
| `0` | The listing was printed, including an empty one. |
| `1` | The repo path is not in a git repository. |
| `2` | A missing or unknown subcommand, an unknown flag, or more than one path. |

## Related

- [`checkpoint` skill](/repobuddy/skills/checkpoint/)
