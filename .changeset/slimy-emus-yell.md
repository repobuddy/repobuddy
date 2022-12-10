---
'@repobuddy/jest': patch
---

fix `withTransformEsmPackages()`.
It needs to set `transformIgnorePatterns` to `[]`.
