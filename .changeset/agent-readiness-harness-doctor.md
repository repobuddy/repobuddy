---
"repobuddy": minor
---

`agent-readiness score` reads buddy-agent-harness `doctor` in the instructions area. When the scored repository has `buddy-agent-harness` installed, the script runs its read-only `doctor --format json` and reports each problem it names as a failing `harness-<problem>` check, listing the affected paths and handing the fix to buddy-agent-harness. With no findings, `harness-doctor` passes. Without the package installed, `harness-doctor` is `n/a` and names it. These checks count toward the instructions area score but never gate the level.
