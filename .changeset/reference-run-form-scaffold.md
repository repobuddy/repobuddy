---
'repobuddy': patch
---

The `scaffold` and `agent-readiness` skills now say how to run their `reference ...` calls: they are cyber-agentkit's `reference` command, run through its `reference` skill, not a program on PATH. `agent-readiness` goes on without migrating when the command cannot run.
