---
"repobuddy": minor
---

`init-buddy` now places each allow and deny entry by what its safety depends on. Entries that are safe in any repo go to user scope: read commands, the deny list, and the auto-mode merge rule. The repo's package scripts go to project shared. `gh pr merge --auto` goes to project local, because its guard is that repo's branch rules. A repo-guarded entry or a script entry is never written at user scope.
