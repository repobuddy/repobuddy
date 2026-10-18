---
"repobuddy": patch
---

`setup-github-repo` now finds the default branch ruleset. `detect-state` read `conditions` from the ruleset list, which GitHub does not return, so it always reported none and offered to create a duplicate.
