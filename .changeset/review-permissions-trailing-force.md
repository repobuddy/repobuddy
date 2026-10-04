---
"repobuddy": patch
---

`review-permissions` now covers a force flag after the arguments (`git push origin main --force`) with word-bounded rules: `Bash(git push * --force)`, `Bash(git push * --force *)`, and the same two for `-f`. These leave `--force-with-lease` allowed. It no longer suggests `Bash(git push * --force*)`, and flags an existing one the same way it flags `Bash(git push --force*)`.
