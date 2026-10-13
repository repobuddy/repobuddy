---
'repobuddy': minor
---

Ship `project-tracker.capabilities.gitlab`, GitLab's capabilities reference, and bundle it with the `issue` skill in place of the inline GitLab fallback. It works through `glab api`: issues on every tier, group epics as work items on Premium and Ultimate (18.1 or later), an issue labelled `epic` with tasks on Free, and initiatives as labelled epics on Ultimate. Its calls follow GitLab's documentation and have not yet run against a GitLab instance; each is marked untested.
