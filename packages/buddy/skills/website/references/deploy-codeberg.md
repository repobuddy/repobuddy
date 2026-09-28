# Deploy to Codeberg Pages

Codeberg Pages (the git-pages server), deployed by a Forgejo Actions workflow. It is a Codeberg service,
not a Forgejo feature: self-hosted Forgejo and Gitea have no built-in static hosting (see Step 1 of
[deploy.md](deploy.md)).

Reference: [Codeberg Pages](https://docs.codeberg.org/codeberg-pages/),
[deploying from Forgejo Actions](https://docs.codeberg.org/codeberg-pages/forgejo-actions/),
[Codeberg's hosted runners](https://codeberg.org/actions/meta).

## Requirements

- The repo is public and under a free/libre license. Codeberg's hosted runners only run jobs for such
  repos.
- Actions is turned on for the repo. It is off by default. The user turns it on under **Settings >
  Units > Overview**. Check with `fj` or `tea` if either is logged in; otherwise, ask the user.

Codeberg's old Pages server (v2) does not accept new users. Accounts that used it before keep working, and
can move to git-pages following the
[migration guide](https://docs.codeberg.org/codeberg-pages/migrating-from-pages-v2/). This file covers
git-pages only.

## Base path

| Case | `SITE_URL` | `BASE` |
|---|---|---|
| Any public repo | `https://<owner>.codeberg.page` | `/<repo>` |
| A repo named `pages` | `https://<owner>.codeberg.page` | `/` |
| Custom domain | `https://<domain>` | `/` |

## Workflow

Create `.forgejo/workflows/deploy-pages.yml`:

```yaml
name: Deploy to Codeberg Pages

on:
  push:
    branches: [<DEFAULT_BRANCH>]
    paths:
      - '<SITE_DIR>/**'
      - '.forgejo/workflows/deploy-pages.yml'
  workflow_dispatch:

jobs:
  deploy:
    if: ${{ forge.ref == 'refs/heads/<DEFAULT_BRANCH>' }}
    runs-on: codeberg-small
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: <NODE_VERSION>
      # <PACKAGE_MANAGER_SETUP>: `run: corepack enable` for pnpm or yarn
      - run: <INSTALL_CMD>
      - run: <BUILD_CMD>
      - uses: https://codeberg.org/git-pages/action@v2
        with:
          site: <SITE_URL><BASE>/
          token: ${{ forge.token }}
          source: <DIST_DIR>/
```

- Leave out the `paths` filter when the site is the whole repo.
- For a custom domain, set `site` to `https://<domain>/` and add `server: codeberg.page`.
- `forge.token` is filled in by Forgejo Actions. No secret needs to be created.
- `codeberg-small` allows 5 minutes per job. If the install and build take longer, use `codeberg-medium`
  (10 minutes).
- If the checkout or setup-node versions do not resolve on Codeberg, use the versions its other
  workflows use, or the ones in the Codeberg docs.

## Enable Pages

There is no setting beyond turning on Actions. The first successful run publishes the site. Open
`SITE_URL` + `BASE` afterwards and check that the page loads with its CSS.
