---
'@repobuddy/jest': patch
---

Fix `js-cjs` config to work with ESM packages.

Needs the same `transformIgnorePatterns: []` so that the packages can be transformed.

The tests in `js-cjs` was not executed because of missing `coverage` test.
