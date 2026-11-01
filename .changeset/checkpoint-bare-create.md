---
"repobuddy": minor
---

`checkpoint`: a bare `/checkpoint` now runs `create` when the repo has no checkpoint yet, since there is nothing to resume. With checkpoints present, or outside a git repo, it still shows the help.
