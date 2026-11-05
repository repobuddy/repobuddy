---
"repobuddy": patch
---

A bare `/checkpoint` in a new or just-cleared session now runs `resume`, since there is no work to `create` from. (Patch: it refines the skill's default routing without adding a subcommand.)
