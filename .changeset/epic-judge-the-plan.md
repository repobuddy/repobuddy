---
"repobuddy": minor
---

`epic` judges the plan, not just files it. It routes to Create, Revise, Review, Handoff, Promote, and Demote. Create and Revise settle the plan one section at a time, judge it against the planning criteria EP1 to EP14 (`project-tracker.criteria.epic`, overridable), and fix what fails before presenting. They run a research step through `research.method`, which uses `research-workbench`'s `deep-research` by default. `project-tracker.executors` says what a person and an agent can do on the tracker. The epic template gains key terms, open questions, a run order, risks, and item IDs. The tracker capabilities gain `Board`, `Transfer`, `Depend`, and `Sync body`, and a new `epic-plan.mjs` script reads the blocked-by graph, batches blocker changes, syncs the child list, and checks a filed epic.
