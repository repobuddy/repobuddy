---
"repobuddy": patch
---

`commit` skill evals: the `sandbox-blocked` check accepts "uncommitted: blocked by sandbox" with a comma or dash in place of the colon, so the case fails only when the agent commits or never reports the block.
