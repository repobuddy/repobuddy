---
"repobuddy": patch
---

`init-buddy`: the allow list splits the stash grant into `push`, `list`, `show`, and `apply`, and offers `rebase.autoStash`, because `git stash *` also admits `drop` and `clear` on a stack every worktree shares. The deny list adds the `changeset publish` forms run through a package manager, which `Bash(changeset publish*)` alone misses.
