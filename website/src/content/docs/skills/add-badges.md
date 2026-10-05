---
title: add-badges
description: Add, fix, or audit the status badge row in a readme, using facts detected from the repository.
---

`add-badges` writes a badge row (npm version and downloads, CI or release status, docs, coverage, license) under the
readme's H1. It picks only badges whose subject exists, up to six, and checks each link before writing.

## When to use

- A readme opens straight into prose with no status row.
- A repo was renamed, transferred, or changed its default branch, so badge URLs are stale.
- A package started publishing to npm, or a docs site was just deployed.

## Invoke

Run `/add-badges`, or ask: "add badges to the readme", "the badges are stale after the transfer". It takes no arguments.

## What it changes

- A badge row in the readme your audience renders: the root readme, the published package's readme, or the source of a
  generated readme.
- A patch changeset when the readme ships inside a published package and the repo uses changesets.

It detects repo identity, visibility, package name, workflows, license file, and docs URL.
It checks that the badges render on the pushed branch before you merge.

## Requirements

- `gh` for `gh repo view` (repo identity, visibility, homepage).
- Network access to verify badge targets.

## Example

```
/add-badges
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/add-badges).
