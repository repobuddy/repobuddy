---
'repobuddy': minor
---

The `issue` skill now loads its body templates and level checks by name through agent-harness, so a project can override one section with `merge-sections`. The package ships new references: `repobuddy.work-levels`, `repobuddy.work-template.bug`, `.feature`, `.task`, `.epic`, and `.initiative`, and `project-tracker.contract`, which says what a `project-tracker.capabilities.<tracker>` reference must contain. `project-tracker.capabilities.github` now declares `contract: 1`, and the skill stops on a capabilities reference whose contract version it does not know.
