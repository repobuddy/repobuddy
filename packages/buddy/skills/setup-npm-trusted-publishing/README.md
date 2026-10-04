# setup-npm-trusted-publishing

Registers npm trusted publishers so GitHub Actions publishes your packages through OIDC, and the long-lived `NPM_TOKEN` can be retired. It covers one package, one repo, one organization, or every organization you own, and registers them in a single batch under one 2FA code.

## When to use

- "set up trusted publishing for this package"
- "get rid of `NPM_TOKEN`"
- publishing fails with `E401 Unauthorized - GET .../-/whoami` because the token expired
- rolling OIDC out across many packages, or across repos under a personal account, where there is no org-level secret to share

It registers only the npm side. Adding OIDC to the release workflow and giving the job `id-token: write` come first and are not part of this skill.

## Before you start

- npm 11.15.0 or later, logged in, with account-level 2FA
- `gh` logged in. If it is missing or logged out, the skill runs [`init-buddy`](../init-buddy/README.md) when that is installed.
- the publishing job already declares `id-token: write`
- each package already exists on the registry; trust cannot be registered before the first publish

## What it does

1. **Asks the scope:** one package, one repo and all its packages, one organization or user, or every organization plus your own repos. Organization-wide runs cover source repos only, not forks.
2. **Plans** with a bundled script. It writes `.github/npm-trust-plan.json`, which has one row per package, because trust is per package name, not per repo. Each row is `configure`, `already-configured`, `not-published`, or `private`.
3. **Reviews the plan with you.** It checks that each row names the entry-point workflow (such as `release.yml`) and not a reusable workflow it calls, since npm rejects that at publish time. It flags unpublished packages and repos that publish nothing, then shows the rows it will configure and asks you to confirm.
4. **Applies** with one 2FA code. One successful authentication covers roughly five minutes or eighty packages. It stops at the first auth failure instead of repeating it down the list. Re-running skips the rows already done. An `E409` means a publisher already exists; it counts that as already configured, not as a failure. It also tells you to check with `npm trust list` that the existing entry points at the right repo and workflow.
5. **Verifies** with `npm trust list`: repository, workflow file name, and publish permission. Then it waits for a release to publish without `NPM_TOKEN`.
6. **Retires the token**, only after a release has published through OIDC, and as a separate step: it deletes the `NPM_TOKEN` secret and, if you choose, sets the package to require 2FA and disallow tokens. That last setting breaks every remaining token-based publish, so it never comes in the same pass as registering trust.

If your account uses browser-based 2FA, you run one `npm trust github …` yourself in a terminal to open the window, then the skill applies the rest.

## How to invoke

Ask for it directly, or run `/setup-npm-trusted-publishing` where slash commands are supported.

## What it produces

A plan file at `.github/npm-trust-plan.json`, a trusted publisher registered on npm for each package you confirmed, a count of the ones that were already configured, and, once OIDC publishing is proven, the `NPM_TOKEN` secret removed.

## Install

Install the `repobuddy` plugin (see the [repository readme](../../../../readme.md#installing-as-a-plugin)), or add
the skill alone:

```sh
npx skills add repobuddy/repobuddy --skill setup-npm-trusted-publishing
```

A skill installed with `skills add` comes from git and has no built `scripts/` folder. It runs its
script through `npx -y repobuddy@^1.9.0` instead, which needs network access. The plugin install
ships the script with the skill.
