---
"repobuddy": patch
---

`commit`: after a run of ACED's spec judge, the skill:
- writes and shows the message, and commits only when asked, when asked for a message for what is staged
- checks a `-U0` patch with `--unidiff-zero`
- restores the staged selection after a conflicting stash pop
- does not count its own stash `reset` as a Validate failure
- never amends
- says why it skipped the staged-snapshot check
- stages a run of adjacent lines with `update-index` instead of trying to split it with a patch
- asks, or stops, about a line two units need instead of rewriting it to fit one
- is not selected for pushing, opening a pull request, or amending, squashing, or undoing a commit

A `commit.message` override of `Type` now sets the allowed types when there is no commitlint config.
