# min-release-age

Lifts a repository's minimum-release-age gate for one package version. It checks the release first, records when the lift expires, and removes the lift after that time. It can also install a daily CI job that does the removal for you, on GitHub, GitLab, Bitbucket, Azure Pipelines, Forgejo, or Gitea.

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
| *(no argument)* | Shows the gate, active lifts and their expiry, the git host and CI systems it found, and whether the cleanup job is installed. Offers to restore expired lifts or install the job. |
| `lift <pkg>[@version\|@tag]` | Resolves the bare name to `latest` (or the given tag or version), checks the release (provenance, publisher, diff from the previous version), then adds an exemption for that exact version with an expiry marker. |
| `restore` | Removes lifts whose expiry has passed. |
| `setup-ci` | Detects the CI provider and adds a daily job that removes expired lifts and opens or updates a PR/MR. |

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
- **About the CI job:** it runs on a schedule only (plus manual dispatch where the provider has it) and can only delete marked lines. The GitHub template pins its checkout action by SHA. On GitHub, Forgejo, and Gitea, a PR opened with the automatic token does not trigger CI, so set a `MIN_RELEASE_AGE_TOKEN` secret if the restore PR must pass required checks.

## How to invoke

Ask for it directly, or run `/min-release-age [lift <pkg>[@version|@tag] | restore | setup-ci]` where slash commands are supported.

## What it produces

A config change with a lift marker plus the updated lockfile, a restore commit, or a scheduled CI job plus a copy of the script:

| Provider | Job | Script | Also needed |
|---|---|---|---|
| GitHub Actions | `.github/workflows/min-release-age.yml` | `.github/scripts/` | optional token secret |
| GitLab CI | `.gitlab/ci/min-release-age.yml`, included from `.gitlab-ci.yml` | `ci/` | pipeline schedule with `MIN_RELEASE_AGE=restore`, and a token or job-token push access |
| Bitbucket Pipelines | `custom: min-release-age` in `bitbucket-pipelines.yml` | `ci/` | schedule in repository settings, repository access token |
| Azure Pipelines | `.azure-pipelines/min-release-age.yml` | `ci/` | pipeline registration, build-service permissions |
| Forgejo / Gitea | `.forgejo/workflows/` or `.gitea/workflows/` | `.forgejo/scripts/` or `.gitea/scripts/` | optional token secret |
| anything else | written for the repo's own CI system | `ci/` | depends on the system |

The skill detects the provider from the git remote and the CI files in the repo, and loads only that provider's instructions. It asks before creating schedules, registering pipelines, or requesting tokens.

## Install

Install the `repobuddy` plugin (see the [repository readme](../../../../readme.md#installing-as-a-plugin)), or add
the skill alone:

```sh
npx skills add repobuddy/repobuddy --skill min-release-age
```

A skill installed with `skills add` comes from git and has no built `scripts/` folder. It runs its
script through `npx -y repobuddy@^1.8.0` instead, which needs network access. The plugin install
ships the script with the skill.
