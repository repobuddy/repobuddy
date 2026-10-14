---
'repobuddy': patch
---

Fix `project-tracker.capabilities.gitlab`: `glab api` has no `--jq` flag, so every call now pipes its output to `jq`, which the reference lists as a prerequisite. The project issue search drops `in=title,description`, which the project issues endpoint does not document; `search` already matches the title and description.
