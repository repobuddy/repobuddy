---
"@repobuddy/typescript": minor
"repobuddy": minor
---

Bump `clibuilder` from `^10.1.0` to `^11.0.0`. The prior `^10.1.0` range could never
cross into the published `11.0.0` major (a caret cannot span majors), which meant every
consumer of `@repobuddy/typescript` — roughly 46 repos in the estate use it as a
devDependency — kept resolving `clibuilder@10.1.0` and, through it, a stale `type-plus`
and `tersify` major in their tree even after those packages published current majors.

`clibuilder@11.0.0`'s own major came from a `type-plus@8` pin (its emitted `.d.ts` now
requires TypeScript `>= 5.6.0`), not from an API change — the `PluginActivationContext`
shape `@repobuddy/typescript` re-exports is unchanged, so this is not a breaking change
for consumers on TypeScript `>= 5.6` (this repo already requires `^7.0.0`/`^6.0.0`).
Shipping it as `minor` here lets the ~46 consumers of `@repobuddy/typescript` pick up
the fix and drop the stale transitive `type-plus`/`tersify` majors without a forced
major bump of their own.
