---
'@repobuddy/vitest': minor
---

Recognize `*.load.ts|js` as a test filename.

Load tests are slow, so they are not part of a normal run. `buddyConfigDefaults.include.testLoad`
holds their pattern, `nodeTestPreset` and `browserTestPreset` take an `includeLoadTests` option to
opt in, and `buddyConfigDefaults.exclude.test` now covers `.load.` files so they are not counted as
source in coverage.
