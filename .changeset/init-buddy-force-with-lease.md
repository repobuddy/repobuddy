---
"repobuddy": patch
---

`init-buddy`'s force-push deny entries no longer block `git push --force-with-lease` or `--force-if-includes`. They are word-bounded now (`Bash(git push --force *)`, `Bash(git push * --force)`, and the `-f` forms), so the agent can still update a rebased PR branch, matching `review-permissions`.
