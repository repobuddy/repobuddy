---
"repobuddy": minor
---

`init-buddy` sets up Claude Code auto mode. It drafts `autoMode.environment` from `gh` (the namespaces you own or administer, and each one's visibility) and your answers, keeps the namespace list in one entry the others refer to, flags template text left in an entry, and offers `autoMode.allow` rules for queued merges and `--force-with-lease` pushes beside the merge rule. Each line says whether it is written explicitly or left to Claude Code's defaults, and outward-facing commands stay out of the allow list, because an allow entry skips the classifier. Run it again after joining an organization to refresh the namespace entry.
