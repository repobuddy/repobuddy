---
'repobuddy': patch
---

The `epic`, `initiative`, `issue`, and `project-tracker` skills now say how to run their `reference ...` calls: they are cyber-agentkit's `reference` command, not a program on PATH, run through its `reference` skill. Each step that runs one now says what to do when the command cannot run, instead of leaving the agent to guess.
