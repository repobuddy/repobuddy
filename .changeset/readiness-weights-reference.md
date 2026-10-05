---
"repobuddy": minor
---

`agent-readiness` now reads its area weights from the reference `repobuddy.readiness`, resolved by `@cyberuni/agent-harness`. The skill ships the default copy in `references/repobuddy.readiness.md`, with the weights in a `## Weights` section. A repo overrides the weights in `.agents/references/repobuddy.readiness.md`:

```markdown
---
merge: merge-sections
---

## Weights

- verification: 40
```

`.agents/readiness/weights.json` is deprecated. For this release it is still read when no project override exists, and the script prints the exact override file to create in its place. A later release stops reading it.
