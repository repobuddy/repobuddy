---
"repobuddy": patch
---

The `commit` skill now amends the latest commit when it is on no remote and the fix belongs to its unit, instead of adding a fix commit. It still never rewrites a pushed commit.
