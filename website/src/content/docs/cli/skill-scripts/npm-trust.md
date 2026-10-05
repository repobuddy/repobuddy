---
title: buddy npm-trust
description: Plan and register npm trusted publishers (OIDC) for the setup-npm-trusted-publishing skill.
---

`buddy npm-trust` plans and registers npm trusted publishers for one or many repositories. The
`setup-npm-trusted-publishing` skill runs it.

## Usage

```sh
buddy npm-trust plan  [--package <name> --repo <owner/name> | --repo <owner/name> | --org <login> | --all-orgs] [--file <workflow>] [--dir <repo>] [--verbose]
buddy npm-trust apply --otp=<code> [--dir <repo>] [--verbose]
```

## Subcommands

| Subcommand | Effect |
| --- | --- |
| `plan` | Resolves the scope to a list of packages and writes `.github/npm-trust-plan.json`. |
| `apply` | Reads the plan and runs `npm trust github` once for each package whose action is `configure`. |

## Arguments

| Flag | Used by | Type | Effect |
| --- | --- | --- | --- |
| `--package` | `plan` | string | One package. Needs `--repo`. |
| `--repo` | `plan` | `owner/name` | One repository. |
| `--org` | `plan` | string | Every source, non-archived repository of a user or organization (up to 500). |
| `--all-orgs` | `plan` | boolean | Your own account and every organization you belong to. |
| `--file` | `plan` | string | The release workflow file name. With `--package`, it replaces detection. |
| `--otp` | `apply` | string | npm one-time password. Required. |
| `--dir` | both | path | Where `.github/npm-trust-plan.json` lives. Default: the current directory. |
| `--verbose` | both | boolean | Prints detail lines to stderr. |

Each valued flag takes `--flag value` or `--flag=value`.

## Behavior

- `plan` reads repositories through `gh` and checks each package with `npm view`. It writes the plan file and
  changes nothing on npm.
- Each plan row has an action: `configure`, `not-published`, or `private` (the repository publishes nothing).
- `plan` detects the release workflow: a file that runs on push to `main` or `master` and runs a publish step. When
  it guesses, the row carries the note `workflow guessed - confirm before applying`.
- `apply` changes npm. It stops at the first sign-in failure (`EOTP`, `E401`, `E403`), because every package would
  fail the same way.
- A `409` from npm means a trusted publisher already exists. `apply` counts it as `alreadyConfigured`, not as a
  failure.

## Output

stdout is one JSON line. `plan` (the row list stays in the plan file):

```json
{"ok":true,"plan":".github/npm-trust-plan.json","total":2,"counts":{"configure":2}}
```

`apply`:

```json
{"ok":true,"configured":1,"alreadyConfigured":0,"failed":0}
```

`apply` stopped by a sign-in failure:

```json
{"ok":false,"configured":0,"failed":1,"stoppedOn":"foo","reason":"auth"}
```

An error, for example `plan` with no scope:

```json
{"ok":false,"error":"scope required: --package <name> | --repo <owner/name> | --org <login> | --all-orgs"}
```

## Exit codes

| Code | When |
| --- | --- |
| `0` | The plan was written, or every package was configured. |
| `1` | A failed plan or apply, a missing plan file, or a missing `--otp`. |
| `2` | No subcommand, or a subcommand other than `plan` or `apply`. |

## Related

- [`setup-npm-trusted-publishing` skill](/repobuddy/skills/setup-npm-trusted-publishing/)
