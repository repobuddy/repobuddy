---
title: buddy checkpoint
description: List, write, mark resumed, and commit the checkpoints of the checkpoint skill.
---

`buddy checkpoint` does the file work of the [`checkpoint` skill](/repobuddy/skills/checkpoint/):

- `list` lists a repository's checkpoints. The skill's `list` subcommand runs it and shows its output, and `resume`
  runs it when it has to ask which checkpoint to open. It reads files and git state and writes nothing.
- `write` writes a checkpoint. The skill's `save` runs it.
- `mark-resumed` writes the `resumed:` marker into a checkpoint. The skill's `resume` runs it.
- `commit` commits copies of checkpoints in the checkout. The skill's `save --commit` runs it.

Checkpoints live under `.git/`, where some harnesses' file tools refuse to write, so the skill writes them through
this command.

## Usage

```sh
buddy checkpoint list [<repo path>] [--json]
buddy checkpoint write <slug> [<repo path>] [--home] < checkpoint.md
buddy checkpoint mark-resumed <path> --harness <name> --session <id> [--pid <pid>]
buddy checkpoint commit [<slug>...] [--drop <slug>...] [--allow <word>...]
```

## `list`

### Arguments

| Argument | Type | Default | Effect |
| --- | --- | --- | --- |
| `<repo path>` | path | the current directory | A path in the repository to list. |
| `--json` | boolean | off | Prints the listing as JSON instead of text. |

### Behavior

- Inside a git repository, or given a path in one, it reads three folders:
  - `<common git dir>/repobuddy/checkpoints/`, shared by every checkout of the repository.
  - `.agents/repobuddy/checkpoints/` in the checkout. Rows from it say `in this checkout`.
  - `~/.agents/repobuddy/checkpoints/`, keeping only checkpoints whose `repo:` names the repository: its `origin`
    `owner/name`, the folder name of its main checkout, or the folder name of the checkout.
- Outside a repository, it reads only `~/.agents/repobuddy/checkpoints/` and lists every checkpoint there. That
  folder can hold several repositories' checkpoints, so each row adds `repo: <repo>` (`none` when the file has no
  `repo:`), and no row says where its branch is checked out. Without `git` on the path, every directory counts as
  outside a repository.
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

### Output

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

## `write`

It reads the whole checkpoint file from stdin and writes it to `<common git dir>/repobuddy/checkpoints/<slug>.md`,
creating the folder, and prints the path it wrote. An existing file of that slug is replaced.

| Argument | Type | Default | Effect |
| --- | --- | --- | --- |
| `<slug>` | kebab-case name | required | The file name, such as `flaky-login-test`. |
| `<repo path>` | path | the current directory | A path in the repository to write to. |
| `--home` | boolean | off | Writes to `~/.agents/repobuddy/checkpoints/` instead. Outside a repository, without a repo path, that folder is used anyway. |

It writes nothing and exits `2` when the slug is not kebab-case, or the text has no `---` front matter, no
`## NEXT` section, or no `## Not in git` section.

## `mark-resumed`

It writes this block at the end of the checkpoint's front matter, replacing an older one, and prints the `at`:

```yaml
resumed:
  at: 2026-11-22T10:15:00Z
  harness: claude-code
  session: <id>
  pid: <pid>
  started: <the process's start time, from ps -o lstart=>
```

| Argument | Type | Default | Effect |
| --- | --- | --- | --- |
| `<path>` | path | required | The checkpoint file, such as a row's `path` from `list --json`. |
| `--harness` | name | required | The harness that resumed it, such as `claude-code`. |
| `--session` | id | required | The harness's session id. |
| `--pid` | process id | none | The harness's process. Without it, `pid` and `started` are left out, and `list` reads the marker as unknown. When `ps` cannot read the start time, only `started` is left out. |

It exits `2` when the file is missing or is not a checkpoint.

## `commit`

It copies each named checkpoint from `<common git dir>/repobuddy/checkpoints/` to `.agents/repobuddy/checkpoints/` in
the checkout, force-adds the copies (the folder may be excluded), removes each `--drop` copy with `git rm`, and commits
only those paths. Other staged or unstaged changes stay out of the commit. The message is
`docs: checkpoint <slug>, <slug>`, or `docs: drop checkpoint <slug>` when there are only drops. It prints the short
commit hash and the message.

| Argument | Type | Default | Effect |
| --- | --- | --- | --- |
| `<slug>...` | kebab-case names | none | The checkpoints to commit. |
| `--drop <slug>` | kebab-case name, repeatable | none | A committed copy to delete in the same commit. |
| `--allow <word>` | word, repeatable | none | A word the leak check lets through, such as a username that is also a common word. |

Before it copies anything, it checks each checkpoint for `/home/` or `/Users/` paths, Windows drive paths, the home
folder, the username, and the hostname. On a hit it prints each line to stderr, commits nothing, and exits `1`.

It exits `2` when no slug or drop is named, a named checkpoint is missing, or no dropped copy is committed.

## Exit codes

| Code | When |
| --- | --- |
| `0` | The listing, the path written, or the `at` was printed. An empty listing is a success. |
| `1` | The repo path is not in a git repository, or a checkpoint `commit` would leak a path or name. |
| `2` | A missing or unknown subcommand, a missing or unknown argument, or a checkpoint the format does not allow. |

## Related

- [`checkpoint` skill](/repobuddy/skills/checkpoint/)
