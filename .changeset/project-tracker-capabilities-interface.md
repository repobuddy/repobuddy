---
"repobuddy": minor
---

`project-tracker.contract` is now `project-tracker.capabilities.interface`, a cyber-agentkit interface document, so `reference check project-tracker.capabilities.<tracker>` verifies a tracker's capabilities reference against it: its sections, their order, and the required `Tracker` and `Detect`. The GitHub and GitLab capabilities references declare `implements: project-tracker.capabilities@1` and keep `contract: 1` for older skills. The epic, initiative, issue, and project-tracker skills load the interface, read a tracker's version from `implements` or, when it has none, from `contract`, and leave the interface out of the trackers they list.

`project-tracker.contract` still loads, as a stub that names the new reference. An interface document's `aliases` are older interface ids, not older names, so the old name cannot be an alias. The plugin alone serves the interface, since one beside a skill default warns `interface-not-composed`; each skill carries a plain copy it reads when the interface does not load.
