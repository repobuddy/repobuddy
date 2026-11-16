---
"repobuddy": patch
---

The `commit` skill reports a change as "uncommitted: blocked by sandbox" when the harness blocks `git add` or `git commit`, and never changes the sandbox, git config, or hooks to get around it.
