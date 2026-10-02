---
'repobuddy': patch
---

`agent-readiness score` now runs buddy-agent-harness `doctor` when the repo is buddy-agent-harness itself, at its root or as a workspace package, instead of reporting `harness-doctor` as `n/a`. The repo's own package runs from `src/cli.ts`, so it needs no build or published install.
