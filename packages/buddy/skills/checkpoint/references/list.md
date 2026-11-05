# `checkpoint list`: show the checkpoints

Arguments: `[repo path]`.

Show the checkpoints and stop. Never open, resume or continue one, never write the `resumed:` marker, and
never `cd`. `checkpoint resume` uses the same listing when it has to ask which checkpoint to open.

## Procedure

1. **Pick the folders.** Take the first rule that matches:
   1. The user gave a repo path: that repo's `<repo root>/.agents/repobuddy/checkpoints/` (root from
      `git -C <repo-path> rev-parse --show-toplevel`), plus the checkpoints in
      `~/.agents/repobuddy/checkpoints/` whose `repo:` names that repo.
   2. Inside a git repo: this repo's `<repo root>/.agents/repobuddy/checkpoints/` (root from
      `git rev-parse --show-toplevel`), plus the checkpoints in `~/.agents/repobuddy/checkpoints/`
      whose `repo:` names this repo: a pause that couldn't find the repo on disk left them there.
   3. Outside a repo: `~/.agents/repobuddy/checkpoints/`.

2. **List them,** newest `updated` first. Each row has:
   - the title, and the slug
   - the `branch`
   - the `updated` date
   - the `## NEXT` line
   - `waits on <slug>` when its `depends-on` names a checkpoint that still exists
   - for a checkpoint that carries a `resumed:` block, its liveness note, worked out as **Resume
     marker** in [resume.md](resume.md) describes. The marker only annotates: never hide, skip or block
     a checkpoint because of it.

3. **With no checkpoints,** say so and stop. Do not reconstruct one from guesses.

4. **Stop.** Name `/checkpoint resume <slug>` as the way to open one. For another repo's list, resume
   hands off as step 1a of [resume.md](resume.md) describes; `list` only shows.
