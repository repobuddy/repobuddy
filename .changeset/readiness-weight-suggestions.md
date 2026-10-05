---
"repobuddy": minor
---

New `agent-readiness suggest` command. It reads ACED bench comparisons of the suite `repobuddy.readiness` that are tagged with an area (`aced-bench compare … --tag area=<id>`) and suggests a weight for the `## Weights` section of `.agents/references/repobuddy.readiness.md`. It moves a weight one step of 5, clamped to 0–40, only when two or more comparisons show the same pass-rate or token/turn effect and none shows the opposite. Otherwise it says "keep the weight". Cost in dollars never decides. It prints the override line and its evidence, and never writes the file.
