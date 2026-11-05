---
"repobuddy": minor
---

The `issue` skill files an issue about a dependency using the intake document its plugin ships. A library's plugin publishes `repobuddy.intake.<key>` (sections `Applies to`, `Tracker`, `Before filing`, `Criteria`, `Template`, described by the new `repobuddy.intake.interface`); for a dependency, `/issue` loads the document that names the package and files with its tracker, destination, steps, criteria, and template sections. With no matching document it points at the dependency's own tracker instead of filing in the current repository.
