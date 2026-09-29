---
"repobuddy": minor
---

`agent-readiness score` measures the source itself. It reports the share of comment lines in non-test source and lists the most-commented files to sample, so the comment judgment starts from a number instead of a guess. It fails on JSDoc blocks that document nothing, lists top-level JS/TS names that a grep finds in ten or more files, and names the knip command to run when the repo has knip configured.
