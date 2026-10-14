---
'repobuddy': patch
---

Fix `project-tracker.capabilities.gitlab`: `glab api` has no `--jq` flag, so every call now pipes its output to `jq`, which the reference lists as a prerequisite. The project issue search drops `in=title,description`, which the project issues endpoint does not document; `search` already matches the title and description.

Its `Kinds` section also reads a task's label ids from the project, with ancestor groups included, as well as an epic's from the group. A task takes project labels, and a project in a user namespace has no group to query.

Closing an epic on Premium and Ultimate now reads the comment from a file, as the other writes do, so a quote in the reason no longer breaks the GraphQL call.
