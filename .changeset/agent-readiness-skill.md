---
"repobuddy": minor
---

Add the `agent-readiness` skill: scores how ready a repository is for coding agents. A bundled script runs static checks and reports a gated level (1-4), a score per area, the top three fixes, and the tokens every agent session loads; the skill settles the checks a script cannot decide. Security findings cap the level. Read-only. The script also runs as `repobuddy agent-readiness score`.
