---
"repobuddy": minor
---

Upgrading from a repobuddy that used cyber-agentkit 1: run `npx cyber-agentkit@2.1.0 reference migrate` in your repository (or ask the `reference` skill of `cyber-agentkit` to migrate). It prints what it would change in your `.agents/references/` and `~/.agents/references/` files: a `merge: merge-sections` line is removed, since `patch` is now the default, and a `project-tracker.contract` file is renamed `project-tracker.capabilities.interface`. Run it again with `--write` to apply. Files in `~/.agents/references/` are in your home folder, outside git, so read the plan first.

The epic, initiative, issue, project-tracker, scaffold, and agent-readiness skills now offer this when a load warns `reference-legacy-format` or `reference-renamed`: they show the plan and apply it only on your yes.
