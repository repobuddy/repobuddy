---
title: buddy release-age
description: Read, lift, and restore minimum-release-age exemptions for the min-release-age skill.
---

`buddy release-age` reads and edits a repository's minimum-release-age exemptions. The `min-release-age` skill runs
it.

## Usage

```sh
buddy release-age status  [--dir <repo>] [--pm <pm>] [--json] [--check]
buddy release-age lift    <pkg[@version|@tag]> [--dir <repo>] [--pm <pm>] [--name-wide] [--until <ISO>] [--json]
buddy release-age restore [--dir <repo>] [--pm <pm>] [--now <ISO>] [--dry-run] [--json] [--github-output] [--body-file <path>]
buddy release-age open-pr --provider bitbucket|azure|forgejo|gitea --body-file <path> [--branch <b>]
```

## Subcommands

| Subcommand | Effect |
| --- | --- |
| `status` | Prints the gate setting, permanent exemptions, active lifts, the git host, the CI systems found, and whether the cleanup job is installed. |
| `lift` | Adds a time-limited exemption for one version. |
| `restore` | Removes the lifts whose time has passed. |
| `open-pr` | Opens or updates the restore pull request from inside a CI job. |

## Arguments

| Flag | Type | Default | Effect |
| --- | --- | --- | --- |
| `--dir` | path | the current directory | The repository. |
| `--pm` | `pnpm` \| `yarn` \| `npm` \| `bun` | detected | The package manager. |
| `--json` | boolean | off | Prints JSON. |
| `--check` | boolean | off | `status`: exits `1` when any lift has expired. |
| `--name-wide` | boolean | off | `lift`: allows an exemption for the whole package name (npm and bun). |
| `--until` | ISO date | publish time plus the gate window | `lift`: when the lift expires. |
| `--now` | ISO date | the current time | The time to compare against. |
| `--dry-run` | boolean | off | `restore`: reports what it would remove and writes nothing. |
| `--github-output` | boolean | off | `restore`: appends `removed=<n>` and a `body` to the file named by `GITHUB_OUTPUT`. |
| `--body-file` | path | none | `restore`: writes the pull request description there. `open-pr`: reads it. |
| `--provider` | `bitbucket` \| `azure` \| `forgejo` \| `gitea` | none | `open-pr`: the git host API to call. Required. |
| `--branch` | string | `chore/min-release-age-restore` | `open-pr`: the source branch. |

## Package managers

The package manager comes from `--pm`, else the `packageManager` field of `package.json`, else the lock or config
files: `pnpm-lock.yaml` or `pnpm-workspace.yaml`, then `.yarnrc.yml` or `yarn.lock`, then `bun.lock`, `bun.lockb`, or
`bunfig.toml`, then `package-lock.json` or `.npmrc`.

| Manager | File | Gate setting | Exemption list | Exempts one version |
| --- | --- | --- | --- | --- |
| pnpm | `pnpm-workspace.yaml` | `minimumReleaseAge` | `minimumReleaseAgeExclude` | yes |
| Yarn | `.yarnrc.yml` | `npmMinimalAgeGate` | `npmPreapprovedPackages` | yes |
| npm | `.npmrc` | `min-release-age` | `min-release-age-exclude` | no |
| bun | `bunfig.toml` | `minimumReleaseAge` | `minimumReleaseAgeExcludes` | no |

## Behavior

- `lift` takes `pkg` (latest), `pkg@tag`, or `pkg@x.y.z`, and always writes the exact version.
- Every lift is two lines: a marker comment, then the entry.

  ```yaml
  # min-release-age: lift <pkg@version> until <ISO>
  - '<pkg@version>'
  ```

- `restore` removes a marker and its entry once `until` has passed. An entry without a marker is permanent and is
  never touched.
- For npm and bun, `lift` refuses without `--name-wide`, because those managers can exempt only a whole package name.
- A successful `lift` also reports the cleanup job. When it is not installed, the summary says to install it in the
  same change.
- `open-pr` reads the repository and token from the CI job's environment:
  - Bitbucket: `BITBUCKET_WORKSPACE`, `BITBUCKET_REPO_SLUG`, `BITBUCKET_BRANCH`, `MIN_RELEASE_AGE_TOKEN`.
  - Azure: `SYSTEM_COLLECTIONURI`, `SYSTEM_TEAMPROJECT`, `BUILD_REPOSITORY_ID`, `BUILD_SOURCEBRANCH`,
    `SYSTEM_ACCESSTOKEN`.
  - Forgejo and Gitea: `GITHUB_SERVER_URL`, `GITHUB_REPOSITORY`, `GITHUB_REF_NAME`, and `MIN_RELEASE_AGE_TOKEN` or
    `GITHUB_TOKEN`.

## Output

`status` in this repository:

```
package manager: pnpm (/path/to/repobuddy/pnpm-workspace.yaml)
gate: minimumReleaseAge = 1440 (1440 minutes)
exemptions: single version
permanent: assertron, satisfier, ..., @repobuddy/*, @unional/*
lifts: none
git host: github (https://github.com/repobuddy/repobuddy.git)
ci systems: github
cleanup job: not installed — setup-ci would target github
```

`lift` prints `lifted <spec> as '<entry>' in <file> until <ISO>` and a `cleanup job:` line, or
`no change: <reason>`. `restore` prints `removed <n> expired lift(s)` (or `would remove` with `--dry-run`) and
`<n> active lift(s) kept`. `open-pr` prints JSON.

## Exit codes

| Code | When |
| --- | --- |
| `0` | Success. `restore` exits `0` whether or not it removed anything. |
| `1` | A failed `lift`, `restore`, or `open-pr`, or `status --check` found an expired lift. |
| `2` | No subcommand, an unknown subcommand, `lift` without a package, `open-pr` without `--provider` and `--body-file`, or no package manager detected. |

## Related

- [`min-release-age` skill](/repobuddy/skills/min-release-age/)
