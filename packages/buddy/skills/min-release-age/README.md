# min-release-age

Lifts a repository's minimum-release-age gate for one package version. It checks the release first, records when the lift expires, and removes the lift after that time. It can also install a daily GitHub workflow that does the removal for you.

Works with pnpm, Yarn Berry, npm, and bun.

## When to use

- an install fails with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` or `All versions satisfying "…" are quarantined`
- "I need the release that came out an hour ago"
- "what's exempt from the release-age gate?"
- "put the gate back" / "clean up the old exemptions"
- "restore it automatically"

## What it does

| Mode | Result |
|---|---|
| *(no argument)* | Shows the gate, active lifts and their expiry, and whether the cleanup workflow is installed. Offers to restore expired lifts or install the workflow. |
| `lift <pkg@version>` | Checks the release (provenance, publisher, diff from the previous version), then adds an exemption with an expiry marker. |
| `restore` | Removes lifts whose expiry has passed. |
| `setup-ci` | Adds a daily workflow that removes expired lifts and opens a PR. |

A lift is written as two lines, and only lines like these are ever removed:

```yaml
minimumReleaseAgeExclude:
  - '@myorg/*'                                   # permanent, never touched
  # min-release-age: lift left-pad@1.3.1 until 2026-09-17T11:00:00Z
  - 'left-pad@1.3.1'
```

The expiry is the version's publish time plus the gate window. After that time the version passes the gate without help, so removing the lift changes nothing about what installs. It only keeps the list short and accurate.

### Scope of a lift

| Package manager | Config file | What a lift exempts |
|---|---|---|
| pnpm 10.19+ | `pnpm-workspace.yaml` | that one version |
| Yarn 4.10+ | `.yarnrc.yml` | that one version |
| npm | `.npmrc` | every version of the package, until expiry |
| bun | `bunfig.toml` | every version of the package, until expiry |

npm and bun cannot exempt a single version, so the skill asks before it exempts the whole package name.

## Security notes

- **Tracking in public is fine.** The exemption is already visible in the config file. A version pin trusts only a release that already exists, and the lockfile holds its integrity hash.
- **Keep the reason out of it.** Commits and PRs name the package, not why it was needed. An undisclosed vulnerability belongs in a private advisory.
- **About the workflow:** it runs on `schedule` and `workflow_dispatch` only, pins its checkout action by SHA, and can only delete marked lines. A PR opened with `GITHUB_TOKEN` does not trigger CI, so set a `MIN_RELEASE_AGE_TOKEN` secret (GitHub App token or fine-grained PAT) if the restore PR must pass required checks.

## How to invoke

Ask for it directly, or run `/min-release-age [lift <pkg@version> | restore | setup-ci]` where slash commands are supported.

## What it produces

A config change with a lift marker plus the updated lockfile, a restore commit, or `.github/workflows/min-release-age.yml` with its script at `.github/scripts/min-release-age.mjs`.

## Install

```sh
npx skills add repobuddy/repobuddy --skill min-release-age
```
