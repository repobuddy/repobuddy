# min-release-age

Exempts one package version from a repository's minimum-release-age gate. It checks the release first, records when the exemption expires, and removes the exemption after that time. An exemption always schedules its own removal: when the repo has no cleanup job yet, it installs a daily CI job in the same change, on GitHub, GitLab, Bitbucket, Azure Pipelines, Forgejo, or Gitea.

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
| *(no argument)* | Shows the gate, active exemptions and their expiry, the git host and CI systems it found, and whether the cleanup job is installed. Offers to restore expired exemptions or install the job. |
| `exempt <pkg>[@version\|@tag]` | Resolves the bare name to `latest` (or the given tag or version), checks the release (provenance, publisher, diff from the previous version), then adds an exemption for that exact version with an expiry marker. If no cleanup job is installed, it runs `setup-ci` in the same change. |
| `restore` | Removes exemptions whose expiry has passed. |
| `setup-ci` | Detects the CI provider and adds a daily job that removes expired exemptions and opens or updates a PR/MR. The first exemption runs it for you. |

An exemption is written as two lines, and only lines like these are ever removed:

```yaml
minimumReleaseAgeExclude:
  - '@myorg/*'                                   # permanent, never touched
  # min-release-age: exempt left-pad@1.3.1 until 2026-09-17T11:00:00Z
  - 'left-pad@1.3.1'
```

The expiry is the version's publish time plus the gate window. After that time the version passes the gate without help, so removing the exemption changes nothing about what installs. It only keeps the list short and accurate.

### Scope of an exemption

| Package manager | Config file | What an exemption covers |
|---|---|---|
| pnpm 10.19+ | `pnpm-workspace.yaml` | that one version |
| Yarn 4.10+ | `.yarnrc.yml` | that one version |
| npm | `.npmrc` | every version of the package, until expiry |
| bun | `bunfig.toml` | every version of the package, until expiry |

npm and bun cannot exempt a single version, so the skill asks before it exempts the whole package name.

## Security notes

- **Tracking in public is fine.** The exemption is already visible in the config file. A version pin trusts only a release that already exists, and the lockfile holds its integrity hash.
- **Keep the reason out of it.** Commits and PRs name the package, not why it was needed. An undisclosed vulnerability belongs in a private advisory.
- **About the CI job:** it runs on a schedule only (plus manual dispatch where the provider has it) and can only delete marked lines. A PR opened with the automatic token does not trigger CI. On GitHub, where the `repobuddy` app is installed, the job calls a shared workflow pinned to `repobuddy/.github@v2` that opens the PR with an app token, so no token secret is needed. Without the app, and on Forgejo and Gitea, set a `MIN_RELEASE_AGE_TOKEN` secret if the restore PR must pass required checks; the GitHub fallback template pins its checkout action by SHA.

## How to invoke

Ask for it directly, or run `/min-release-age [exempt <pkg>[@version|@tag] | restore | setup-ci]` where slash commands are supported.

## What it produces

A config change with an exemption marker plus the updated lockfile (and, on the first exemption, the cleanup job), a restore commit, or a scheduled CI job plus a copy of the script:

| Provider | Job | Script | Also needed |
|---|---|---|---|
| GitHub Actions | `.github/workflows/min-release-age.yml` | none with the `repobuddy` app; `.github/scripts/` without it | with the app, nothing; without it, an optional token secret |
| GitLab CI | `.gitlab/ci/min-release-age.yml`, included from `.gitlab-ci.yml` | `ci/` by default; Setup CI asks for the path and the runner image | pipeline schedule with `MIN_RELEASE_AGE=restore`, and a token or job-token push access |
| Bitbucket Pipelines | `custom: min-release-age` in `bitbucket-pipelines.yml` | `ci/` | schedule in repository settings, repository access token |
| Azure Pipelines | `.azure-pipelines/min-release-age.yml` | `ci/` | pipeline registration, build-service permissions |
| Forgejo / Gitea | `.forgejo/workflows/` or `.gitea/workflows/` | `.forgejo/scripts/` or `.gitea/scripts/` | optional token secret |
| anything else | written for the repo's own CI system | `ci/` | depends on the system |

The skill detects the provider from the git remote and the CI files in the repo, and loads only that provider's instructions. It asks before creating schedules, registering pipelines, or requesting tokens. If you decline, the job is still committed, and the skill tells you which step is left; until it is done, expired exemptions stay until you run `restore`.

## Install

Install the `repobuddy` plugin (see the [repository readme](https://github.com/repobuddy/repobuddy/blob/main/readme.md#installing-as-a-plugin)), or add
the skill alone:

```sh
npx skills add repobuddy/repobuddy --skill min-release-age
```

The skill runs the `repobuddy` CLI through `scripts/repobuddy.mjs`, which is committed, so a skill
installed with `skills add` from git has it too. It runs the CLI of the `repobuddy` package it sits in,
or else fetches the matching release through npx, which needs network access.
The `min-release-age.mjs` script that the CI job copies is built only for the npm package; from git,
the skill takes it from the package instead.
