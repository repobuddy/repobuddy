---
"repobuddy": patch
---

`commit`: after a run of ACED's spec judge, the skill:
- writes and shows the message, and commits only when asked, when asked for a message for what is staged
- checks a `-U0` patch with `--unidiff-zero`
- restores the staged selection after a conflicting stash pop
- does not count its own stash `reset` as a Validate failure
- never amends

A `commit.message` override of `Type` now sets the allowed types when there is no commitlint config.
