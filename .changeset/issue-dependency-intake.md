---
"repobuddy": minor
---

The `issue` skill files an issue about a dependency using the intake document its plugin ships. A library's plugin publishes `project-tracker.intake.<key>` (sections `Applies to`, `Tracker`, `Before filing`, `Criteria`, `Template`, described by the new `project-tracker.intake.interface`); for a dependency, `/issue` loads the document that names the package and files with its tracker, destination, steps, criteria, and template sections. With no matching document it points at the dependency's own tracker instead of filing in the current repository.

The work references move under the `project-tracker` context: `repobuddy.work-levels` is now `project-tracker.levels`, and `repobuddy.work-template.<category>` is now `project-tracker.template.<category>`. The old names still load, with a `reference-renamed` warning; run `reference migrate` to rename a repository's overrides.
