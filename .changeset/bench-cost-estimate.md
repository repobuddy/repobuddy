---
"repobuddy": patch
---

The `agent-readiness` bench plan now prints an estimated spend from the stored results on the same model and runner (or the baseline), counting a task with none at its per-run cap. The skill's cost guidance is corrected to the measured ~$0.07 per `claude -p` run: a 4-task, 3-run bench costs about $1, not $2-5.
