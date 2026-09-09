---
'repobuddy': minor
---

`merge-dep-prs` now gates each merge on **verification reach covering blast radius** instead of on a
green check. A green check is evidence about what CI executed and about nothing else — a dependency
PR can be correct, pass every check in its own repo, and still break every consumer of the artifact
it changed, because no check ever exercised a consumer.

A new Step 3 runs between sorting by CI status and merging: detect whether the diff touches a
consumed artifact (reusable workflow, composite action, published package or preset, container
image, depended-on workspace package); name what shrank CI's reach (no test suite, affected-only
selection, path-filtered jobs that skipped); enumerate the consumers when reach falls short — by
looping the org repo list, since `gh search code` misses org-internal matches — and check what each
one resolves. The gate ends in an explicit decision, hold or merge-with-follow-ups, never a
fall-through to merge-on-green. The same gate covers the in-repo case, where `turbo --filter` or
`nx affected` deliberately shrinks reach past edges the task graph does not model.

The skill also gains a `What NOT to do` section and the `README.md` it was shipping without.
