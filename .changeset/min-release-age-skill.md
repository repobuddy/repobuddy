---
'repobuddy': minor
---

New `min-release-age` skill: lifts the minimum-release-age gate for one package version when a fresh
release is needed, and puts it back afterward. Works with pnpm, Yarn Berry, npm, and bun.

Before lifting, it checks the release: provenance, publisher, and the diff from the previous version.
Each lift is written with an expiry marker set to the version's publish time plus the gate window. After
that time the version passes the gate on its own. `restore` removes only marked, expired lifts and never
touches permanent exemptions. npm and bun cannot exempt a single version, so the skill asks before
exempting a whole package name. `setup-ci` installs a daily GitHub workflow that removes expired lifts
and opens a PR.
