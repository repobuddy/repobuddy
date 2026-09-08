---
'repobuddy': minor
---

New `add-badges` skill: builds a readme badge row from facts detected in the repo — package name,
visibility, workflows, license file, docs URL — instead of a fixed template.

It resolves which readme npm and GitHub actually render before writing (in a monorepo that is the
published package's, not the root's), badges the workflow that gates the default branch rather than a
pull-request workflow whose badge reads stale on `main`, skips build badges on private repos where
shields cannot read them, and verifies the badges render on the pushed branch before merge.
