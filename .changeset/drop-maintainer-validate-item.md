---
"repobuddy": patch
---

The epic, initiative, issue, project-tracker, and scaffold skills no longer list a Validate item that runs `node scripts/sync-skill-references.mjs --check`. That script exists only in the repobuddy repository, so an agent in your repository could not run it. The repository's own CI still runs the check.
