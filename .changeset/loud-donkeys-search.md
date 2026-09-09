---
'@repobuddy/jest': minor
---

Recognize `*.load.ts|js` as a test filename.

Load tests are slow, so they are not part of a normal run. `configNode()` keeps its existing
identifiers, and the new `nodeLoad` config (or `configNode(loadTestIdentifiers)`) runs the load
tests on their own. `coveragePathIgnorePatterns` now covers every known identifier, so `.load.`
files are never counted as source even in a config that does not run them.

New exports: `defaultTestIdentifiers`, `loadTestIdentifiers`, `knownTestIdentifiers`, `nodeLoad`.
