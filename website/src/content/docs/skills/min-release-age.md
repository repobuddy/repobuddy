---
title: min-release-age
description: Lift the minimum-release-age gate for one package version, then restore it automatically once the version ages past the window.
---

`min-release-age` exempts one package version from a repository's minimum-release-age gate after checking the release,
records when the exemption expires, and removes it later. A lift always schedules its own removal.

## When to use

- An install fails with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` or `All versions satisfying "..." are quarantined`.
- "I need the release that came out an hour ago."
- "what's exempt from the release-age gate?"
- "put the gate back" or "clean up the old exemptions."

## Invoke

```
/min-release-age [lift <pkg>[@version|@tag] | restore | setup-ci]
```

| Mode | Result |
| --- | --- |
| none | Shows the gate, active lifts and expiry, the git host and CI systems found, and whether the cleanup job exists. Offers to restore expired lifts or install the job. |
| `lift <pkg>[@version\|@tag]` | Resolves a bare name to `latest`, checks provenance, publisher, and diff from the previous version, then adds an exemption with an expiry marker. Runs `setup-ci` if no cleanup job exists. |
| `restore` | Removes lifts whose expiry has passed. |
| `setup-ci` | Adds a daily CI job that removes expired lifts and opens or updates a PR or MR. |

The script also takes `status [--json] [--check]`, `lift ... [--name-wide] [--until <ISO>]`, and `restore [--dry-run]`.

## What it changes

A lift is a marker comment plus an exemption line, and only marked lines are ever removed. The expiry is the version's
publish time plus the gate window.

| Package manager | Config file | What a lift exempts |
| --- | --- | --- |
| pnpm 10.19+ | `pnpm-workspace.yaml` | that one version |
| Yarn 4.10+ | `.yarnrc.yml` | that one version |
| npm | `.npmrc` | every version of the package until expiry |
| bun | `bunfig.toml` | every version of the package until expiry |

The first lift also installs the cleanup job and a copy of the script for the detected provider: GitHub Actions, GitLab
CI, Bitbucket Pipelines, Azure Pipelines, Forgejo, Gitea, or the repo's own CI system. Commits and PRs name the package,
never the reason.

## Asks before acting

For npm and bun it asks before exempting the whole package name. It asks before creating schedules, registering
pipelines, or requesting tokens. If you decline, the job is still committed and it names the step left.

## Requirements

- Node.js for `min-release-age.mjs`. Falls back to `npx -y repobuddy@^1.8.0 release-age` (needs network). See
  [Skill scripts](/repobuddy/cli/skill-scripts/).
- On GitHub, Forgejo, and Gitea, set a `MIN_RELEASE_AGE_TOKEN` secret if the restore PR must trigger required checks.
- GitLab, Bitbucket, and Azure need a schedule or pipeline registration and a token or permission, per the skill README.

## Example

```
/min-release-age lift left-pad@1.3.1
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/min-release-age).
