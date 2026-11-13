---
'@repobuddy/jest': patch
---

Drop the `read-pkg-up` dependency. The presets and resolver now find the nearest `package.json` with a small built-in lookup, so they stay loadable with `require`.

The resolver's subpath `imports` fallback now passes the whole `package.json` to `resolve.imports`. Before, it passed only the `imports` field, so the fallback never matched.
