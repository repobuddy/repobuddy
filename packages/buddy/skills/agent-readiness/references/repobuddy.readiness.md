---
description: agent-readiness tunables. Override a section with merge-sections in .agents/references/repobuddy.readiness.md.
---

## Weights

The repository area weights `agent-readiness score` uses. They order the fixes and the per-area
scores and never touch gates or the level. [weights.md](weights.md) records the bench runs each one
rests on.

A repo overrides them in `.agents/references/repobuddy.readiness.md` with `merge: merge-sections`
in its frontmatter and its own `## Weights` section. List only the areas to change; an area the
override leaves out keeps its default.

- verification: 25
- instructions: 15
- navigability: 15
- noise: 15
- self-describing: 10
- environment: 10
- task-discovery: 5
