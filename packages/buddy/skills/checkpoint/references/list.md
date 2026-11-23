# `checkpoint list`: show the checkpoints

Arguments: `[<repo path>]`.

Show the checkpoints and stop. Never open, resume or continue one, never write the `resumed:` marker, and
never `cd`. `checkpoint resume` uses the same listing when it has to ask which checkpoint to open.

## Procedure

1. **Run the listing.** From the current directory, without `cd`:

   ```sh
   node <this-skill-dir>/scripts/repobuddy.mjs checkpoint list [<repo path>]
   ```

   Pass the repo path when the user gave one. The command reads every folder a checkpoint can be in and
   writes nothing:
   - in a repo: the common git dir (`<common dir>/repobuddy/checkpoints/`, shared by every checkout,
     where `save` writes), this checkout's `.agents/repobuddy/checkpoints/` (a committed copy, or one an
     earlier version wrote), and the checkpoints in `~/.agents/repobuddy/checkpoints/` whose `repo:`
     names the repo;
   - outside a repo: every checkpoint in `~/.agents/repobuddy/checkpoints/`. Each row then names its
     `repo:`, since the folder mixes repos, and none says where its branch is checked out.

   A slug in more than one folder is listed once, from the copy `save` and `resume` read, and the row
   names the older copy. Rows come newest `updated` first, each with the title and slug, the `branch`
   and where it is checked out (`here`, another worktree's path, or `not checked out`), `updated`, the
   `## NEXT` line, `waits on <slug>` for a live `depends-on`, and, for a checkpoint with a `resumed:`
   block, its liveness note as **Resume marker** in [resume.md](resume.md) defines it. `in this checkout`
   marks a row from the checkout's own folder; the next `save` on that topic moves it to the common dir.

   Exit 1 means the repo path is not in a git repo: say so and stop. Use `--json` only when you need a
   field to act on, such as `resume` picking a row.

2. **Show the rows** as the command printed them, in its order. The marker only annotates: never hide,
   skip or block a checkpoint because of it. A branch match with the current checkout is a hint to
   mention, not a choice to make.

3. **With no checkpoints** (`No checkpoints in …`), say so and stop. Do not reconstruct one from guesses.

4. **Stop.** Name `<command> resume <slug>` as the way to open one, with `<command>` from
   [command.md](command.md). For another repo's list, resume
   hands off as step 1a of [resume.md](resume.md) describes; `list` only shows.
