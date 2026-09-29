---
"repobuddy": minor
---

Add `agent-readiness bench`: run a repository's fixed agent task set in clean checkouts with Claude Code and record tokens, turns, tool calls, wall time, pass rate, and cost per successful task, compared against a stored baseline. `bench --init` writes a task-set template, and without `--yes` it only prints the plan and its spend ceiling. `score` now awards Level 5 ("the cost is measured") when a `bench` baseline at most 90 days old exists.
