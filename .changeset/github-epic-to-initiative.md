---
"repobuddy": patch
---

`project-tracker.capabilities.github` and `project-tracker.capabilities.gitlab` now make epic → initiative a new parent instead of a label change: the initiative is created (labelled `initiative`) and the epic is attached as its first child, keeping its label, body, number, and children. An initiative's body is a goal and a metric, not an epic's outcome, and the epic's issues were never the initiative's epics.
