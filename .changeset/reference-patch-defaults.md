---
"repobuddy": patch
---

Finish the move to cyber-agentkit 2.0 references.

- Overrides patch: `project-tracker.contract`, `scaffold.contract`, and agent-readiness describe `merge: patch` (the default) and frontmatter `extends` instead of the retired `merge-sections` and qualified-name override. agent-readiness prints a `merge: patch` override, and passes each load warning on as `<code>: <message>`, so an old `merge-sections` override reports `merge-unknown`; it is still read as a patch.
- The epic, initiative, issue, project-tracker, and scaffold skills read `contract` with `reference load --format json --metadata`; without `--metadata`, 2.0 prints a found name's content alone.
- Each skill's copy of a shipped reference is now its default, `references/<name>.default.md`, which 2.0 reads when the plugin is not installed. The old `references/<name>.md` copies were not read. The plugin's own files declare `extends: [default]`, so a load with both gives no warning.
