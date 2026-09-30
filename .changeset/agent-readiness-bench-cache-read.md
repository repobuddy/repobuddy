---
"repobuddy": patch
---

`agent-readiness bench` now compares each task's median cache-read tokens against the baseline. Claude Code serves nearly all of a run's context from the prompt cache, so uncached input tokens stay near zero and hide a change in how much the agent read.
