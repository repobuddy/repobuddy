---
"@repobuddy/typescript": patch
---

`buddy ts copy-cjs-package-json <dir> [cwd]` (`cpj`) now defaults `cwd` to the current directory, as its help text says. It rejected a call without `cwd` with `missing required argument <cwd>`.
