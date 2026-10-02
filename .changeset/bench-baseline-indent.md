---
"repobuddy": patch
---

`agent-readiness bench --baseline` writes `baseline.json` with the repository's own indent, taken from an existing baseline or the `tasks.json` beside it, so committing it no longer fails a tab-indenting formatter such as Biome.
