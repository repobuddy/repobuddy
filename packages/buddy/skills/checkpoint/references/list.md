# `checkpoint list`: show the checkpoints

Arguments: `[<repo path>]`.

Show the checkpoints and stop. Never open, resume or continue one, never write the `resumed:` marker, and
never `cd`. `checkpoint resume` uses the same listing when it has to ask which checkpoint to open.

## Procedure

1. **Pick the folders.** A repo's checkpoints live in its common git dir, shared by every checkout of
   the repo, so the list is the same from a plain clone, the main checkout or any linked worktree.
   Take the first rule that matches:
   1. The user gave a repo path: read the repo's folders below, running each `git` command with
      `-C <repo-path>`.
   2. Inside a git repo: read this repo's folders below.
   3. Outside a repo: `~/.agents/repobuddy/checkpoints/`.

   A repo's folders are:
   - `<common dir>/repobuddy/checkpoints/`, where the common dir is
     `git rev-parse --path-format=absolute --git-common-dir`. This is where `create` writes.
   - `<checkout root>/.agents/repobuddy/checkpoints/` in the checkout itself (root from
     `git rev-parse --show-toplevel`): a committed copy that came with the branch, or a checkpoint an
     earlier version wrote there. Mark a row from this folder `in this checkout`; the next `create`
     on that topic moves it to the common dir.
   - The checkpoints in `~/.agents/repobuddy/checkpoints/` whose `repo:` names the repo: a pause that
     couldn't find the repo on disk left them there.

   When a slug is in more than one folder, list it once, from the copy with the newest `updated`
   (the common dir's on a tie), and say the other copy is older. `create` and `resume` read the same
   copy.

2. **List them,** newest `updated` first. Each row has:
   - the title, and the slug
   - the `branch`, and where it is checked out: `here` for the current checkout, or the path of the
     other worktree that holds it (from `git worktree list --porcelain`)
   - the `updated` date
   - the `## NEXT` line
   - `waits on <slug>` when its `depends-on` names a checkpoint that still exists
   - for a checkpoint that carries a `resumed:` block, its liveness note, worked out as **Resume
     marker** in [resume.md](resume.md) describes. The marker only annotates: never hide, skip or block
     a checkpoint because of it.

3. **With no checkpoints,** say so and stop. Do not reconstruct one from guesses.

4. **Stop.** Name `<command> resume <slug>` as the way to open one, with `<command>` from
   [command.md](command.md). For another repo's list, resume
   hands off as step 1a of [resume.md](resume.md) describes; `list` only shows.
