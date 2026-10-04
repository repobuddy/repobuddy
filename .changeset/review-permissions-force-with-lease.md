---
"repobuddy": patch
---

`review-permissions` no longer recommends a deny rule that blocks `git push --force-with-lease`. It now suggests `Bash(git push --force *)` and `Bash(git push -f *)`, flags an existing `Bash(git push --force*)` rule for that swap, and scores `--force-with-lease` and `--force-if-includes` below a plain force-push.
