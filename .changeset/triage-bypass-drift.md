---
"repobuddy": patch
---

`setup-github-repo` reports a Triage (`RepositoryRole` 2) bypass actor on any active branch ruleset as drift and offers to remove it. Triage cannot push, so the bypass grants nothing; detect-state used to miss it.
