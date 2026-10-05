---
title: setup-npm-trusted-publishing
description: Register npm trusted publishers so GitHub Actions publishes through OIDC and the NPM_TOKEN can be retired.
---

`setup-npm-trusted-publishing` plans and registers npm trusted publishers for one package, one repo, one organization, or
every organization you own, in one batch under one 2FA code. It registers only the npm side.

## When to use

- "set up trusted publishing for this package" or "get rid of `NPM_TOKEN`"
- Publishing fails with `E401 Unauthorized - GET .../-/whoami` because the token expired.
- Rolling OIDC out across many packages.

## Before you start

- npm 11.15.0 or later, logged in, with account-level 2FA.
- `gh` logged in.
- The release workflow already declares `id-token: write`. Adding that is not part of this skill.
- Each package already exists on the registry.

## Invoke

Run `/setup-npm-trusted-publishing`, or ask in plain words. It asks the scope: one package, one repo, one organization or
user, or every organization plus your own repos (source repos only, not forks).

## What it does

1. Plans with a script and writes `.github/npm-trust-plan.json`, one row per package: `configure`, `already-configured`,
   `not-published`, or `private`.
2. Reviews the plan with you. It checks each row names the entry-point workflow, not a reusable one it calls.
3. Applies the confirmed rows under one 2FA code, stopping at the first auth failure. Re-running skips finished rows. An
   `E409` counts as already configured, and it tells you to check `npm trust list`.
4. Verifies with `npm trust list`, then waits for a release to publish without `NPM_TOKEN`.
5. Retires the token only after an OIDC release succeeded, as a separate step: deletes the `NPM_TOKEN` secret and, if
   you choose, sets the package to require 2FA and disallow tokens.

With browser-based 2FA, you run one `npm trust github ...` yourself first to open the window.

## Asks before acting

The scope, the plan rows to configure, and each token-retirement step. Disallowing tokens breaks every remaining
token-based publish, so it never happens in the same pass as registering trust.

## Hands off to

[`init-buddy`](/repobuddy/skills/init-buddy/) when `gh` is missing or logged out and that skill is installed.

## Requirements

`npm`, `gh`, and `npm-trust.mjs`, which falls back to `npx -y repobuddy@^1.9.0 npm-trust` (needs network). See
[Skill scripts](/repobuddy/cli/skill-scripts/).

## Example

```
/setup-npm-trusted-publishing every package in the acme org
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/setup-npm-trusted-publishing).
