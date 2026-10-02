---
"repobuddy": minor
---

`agent-readiness bench` keeps each run's transcript, gzipped, at `results/<timestamp>/<task>-<run>.jsonl.gz` beside its results file (git-ignored), and records its path as `results[].transcript`, so a cost change can be traced to what the agent read and ran.
