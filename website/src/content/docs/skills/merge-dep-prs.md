---
title: merge-dep-prs
description: Merge dependency-update PRs, gating each merge on whether CI covered what the change can reach.
---

`merge-dep-prs` lists open dependency PRs (Renovate, Dependabot, manual bumps), sorts them by CI status, merges the ones
that clear the gate, fixes the ones that fail, and never touches a release PR.

## When to use

- "merge the pending dependency PRs" or "land the Renovate updates across these repos"
- "clean up the PR queue"
- "why is this dep PR failing?"

## Invoke

Run `/merge-dep-prs`, or ask in plain words. It takes no arguments. It works on one or more repositories.

## The merge gate

It does not merge on green. A green check covers only what CI ran. The merge condition is that verification reach covers
blast radius: what consumes the changed artifact (reusable workflow, composite action, published package or preset,
container image, workspace package) must be covered by what CI executed. Where reach falls short, it enumerates the
consumers, checks what each resolves, and records an explicit decision: hold, or merge and open follow-ups.

## What it produces or changes

- Merged dependency PRs that cleared the gate.
- Fixes pushed to PRs that failed CI (ignored build scripts, Turbo `pipeline` to `tasks`, new lint rules, TypeScript majors, ESM resolution, workflows that will not re-trigger).
- A changeset where the repo needs one.
- Closed PRs that the base branch already superseded.
- For a PR whose radius outran CI's reach, a named decision with its consumer list.

It skips any PR whose purpose is to trigger a release, such as a "Version Packages" PR.

## Hands off to

[`init-buddy`](/repobuddy/skills/init-buddy/) when `gh` or `glab` is missing or logged out and that skill is installed.

## Requirements

`gh` (GitHub) or `glab` (GitLab), logged in, with permission to merge.

## Example

```
/merge-dep-prs merge the open Renovate PRs in this repo
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/merge-dep-prs).
