---
"repobuddy": minor
---

`agent-readiness score --check [--min-level <n>]` holds a repository (levels 1-5) or, with `--package`, a package (levels 1-4) at a level in CI. It exits 1 below the level (default 3). Judgment checks count as unknown: the level comes from the gates the script decides, and the output marks it provisional while judgment gates are unsettled. A repository can override the area weights in `.agents/agent-readiness.json`. Weights only order fixes and area scores, so an override never changes the level.
