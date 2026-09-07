---
'@repobuddy/jest': major
---

Pin `type-plus` to the exact `8.0.0-beta.10`, part of an estate-wide sweep off type-plus 7.

`AnyRecord` appears in this package's emitted declarations (`src/fields/transform.ts`), so
consumers resolve type-plus's own `.d.ts` and inherit its new `typescript >= 5.6.0` peer
dependency — type-plus 5, 6 and 7 declared no typescript peer at all. Hence `major`.

`NonUndefined` was removed in type-plus 8; `src/fields/transform.ts` and
`src/fields/watchPlugins.ts` now use `Exclude<T, undefined>`, the direct equivalent.

Pinned rather than caret-ranged: `^8.0.0-beta.10` would also admit every later 8.0.0
prerelease plus `8.0.0` and `8.1.0`, and this is a prerelease line where breaking changes
land between betas (beta.10 -> beta.11 changed `Equal`'s signature and removed `isType.f`).
An exact version makes each bump a reviewable PR rather than something a lockfile refresh
can do silently.
