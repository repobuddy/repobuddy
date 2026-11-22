---
'repobuddy': minor
---

`checkpoint` stores checkpoints per repository, not per worktree, and resumes by branch.

- `create` writes to `<common git dir>/repobuddy/checkpoints/`, which a plain clone, the main checkout, and every linked worktree share. Removing a worktree or `git clean -fdx` no longer deletes a checkpoint, and no `info/exclude` entry is needed. `--commit` copies the checkpoint into the checkout's `.agents/repobuddy/checkpoints/` and commits that copy.
- `resume` continues in place on the checkpoint's branch. When another worktree has the branch, it names that worktree and stops; when none has it, it says the branch has to be checked out and leaves how to the user.
- `list` and `resume` still read the old per-checkout folder, and `create` moves a matched checkpoint from there to the new place.
