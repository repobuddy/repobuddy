---
description: What the commit skill puts in a commit of a change to a published package. Patch a section in .agents/references/commit.release-notes.md.
tags: [commit, release-notes, changesets]
---

## Release notes

When the repository has `.changeset/config.json`, a commit that changes a published package carries
the changeset for that change: the `.changeset/<name>.md` file is staged and committed with the change,
never in a commit of its own. A package is published when its `package.json` has no `"private": true`
and changesets does not `ignore` it.

A change that touches only tests, docs that do not ship, or an unpublished package carries none.

Otherwise, the commit carries no release notes.

## Writing one

This skill does not write a changeset. When the change needs one and `.changeset/` holds none for it,
write it with the `changesets` skill (`add` mode) from
[repobuddy/buddy-changesets](https://github.com/repobuddy/buddy-changesets), then stage it with the
change. When that skill is not installed, name it and how to install it
(`npx skills add repobuddy/buddy-changesets --skill changesets`), and do not commit the change without
its changeset.
