# Deploy to GitHub Pages

GitHub Pages, deployed by a GitHub Actions workflow (the `workflow` build type, not a branch source).
Requires `gh`, logged in.

## Base path

```bash
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
OWNER=${REPO%%/*}
REPO_NAME=${REPO#*/}
DEFAULT_BRANCH=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name')
```

- A repo named `<OWNER>.github.io` is a user or organization site: `SITE_URL` is
  `https://<OWNER>.github.io` and `BASE` is `/`.
- Any other repo is a project site: `SITE_URL` is `https://<OWNER>.github.io` and `BASE` is
  `/<REPO_NAME>`.
- If Pages already has a custom domain (`gh api "repos/$REPO/pages" --jq .cname` prints one), `SITE_URL`
  is `https://<cname>` and `BASE` is `/`.

## Existing deploys

Look for a deploy that is already there before adding one. Search `.github/workflows/` for
`actions/deploy-pages`, `peaceiris/actions-gh-pages`, `JamesIves/github-pages-deploy-action`, and pushes to a
`gh-pages` branch. Also read every reusable workflow a job calls (`uses: <owner>/<repo>/.github/workflows/...`),
because the deploy step can live there:

```bash
gh api "repos/<owner>/<repo>/contents/.github/workflows/<file>?ref=<ref>" --jq .content | base64 -d
```

A deploy that pushes to a branch does nothing while Pages uses the `workflow` build type. The branch
fills up, the job passes, and the site still returns 404. Replace that deploy with the workflow below and
remove the old job, so only one deploy remains.

## Workflow

Create `.github/workflows/deploy-pages.yml`. Skip this if the file exists and Pages already uses the
`workflow` build type.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [<DEFAULT_BRANCH>]
    paths:
      - '<SITE_DIR>/**'
      - '.github/workflows/deploy-pages.yml'
  workflow_dispatch: {}

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      # <PACKAGE_MANAGER_SETUP>
      - run: <INSTALL_CMD>
      - run: <BUILD_CMD>
      - uses: actions/configure-pages@v6
      - uses: actions/upload-pages-artifact@v5
        with:
          path: <DIST_DIR>

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deploy.outputs.page_url }}
    steps:
      - id: deploy
        uses: actions/deploy-pages@v5
```

Leave out the `paths` filter when the site is the whole repo. `workflow_dispatch: {}` rather than a bare
`workflow_dispatch:` passes YAML linters that forbid empty mapping values. `cancel-in-progress: false` lets a running
deploy finish, so a newer push cannot cancel it halfway.

Replace `<PACKAGE_MANAGER_SETUP>`:

| PM | Steps |
|---|---|
| pnpm | `pnpm/action-setup@v6` (it reads the version from `packageManager`, so pass none), then `actions/setup-node@v7` with `node-version` and `cache: pnpm` |
| yarn | `actions/setup-node@v7` with `node-version` and `cache: yarn` |
| bun | `oven-sh/setup-bun@v2` |
| npm | `actions/setup-node@v7` with `node-version` and `cache: npm` |

These were the latest major versions on 2026-09-20. Check each action's releases for a newer major. If
the repo already uses these actions in other workflows, match the versions it uses.

## Enable Pages

Check the current state:

```bash
gh api "repos/$REPO/pages" --jq '{build_type, html_url, cname}' 2>/dev/null
```

If Pages is not enabled (the call returns 404):

```bash
gh api "repos/$REPO/pages" --method POST --field build_type=workflow
```

If Pages uses a branch source (`build_type` is `legacy`):

```bash
gh api "repos/$REPO/pages" --method PUT --field build_type=workflow
```

If `build_type` is already `workflow`, change nothing. Check it again afterwards: the expected result is
`build_type: "workflow"` and an `html_url` that matches `SITE_URL` and `BASE`.

## Anti-patterns

- Do not set `build_type=legacy` (branch source). It needs a committed build branch and makes the
  workflow redundant.
