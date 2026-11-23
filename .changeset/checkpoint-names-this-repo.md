---
"repobuddy": minor
---

`buddy checkpoint list --json` gives each checkpoint a `namesThisRepo` field, saying whether its `repo:` names the listed repository. `checkpoint resume` now reads that field and `checkedOut` from the listing instead of parsing `git worktree list` itself; its stop lines keep their wording.
