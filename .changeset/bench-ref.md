---
"repobuddy": minor
---

`agent-readiness bench --ref <commit>` benches a past commit on today's task set: each run checks that commit out and overlays HEAD's `.agents/readiness/bench/` on it, so two commits compare on the same tasks without cherry-picking. Results files and `baseline.json` now carry `schemaVersion: 2` and record both the commit benched (`commit`) and the task set's (`taskSetCommit`); `references/bench-results.md` documents the format.
