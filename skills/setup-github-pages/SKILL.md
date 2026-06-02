---
name: setup-github-pages
description: Use this skill when deploying a static site to GitHub Pages — configures base path, Actions workflow, and Pages source.
---

# Setup GitHub Pages

Configures a repo to deploy a static site to GitHub Pages using GitHub Actions as the build source. Idempotent: checks current Pages state before applying.

## When to use

- Adding GitHub Pages to a repo that has a static site generator (Astro, VitePress, VuePress, Next.js static export, plain Vite, Jekyll, Hugo, CRA)
- The site lives in a monorepo subdirectory or at the repo root
- Pages has never been enabled, or was previously using branch source and needs migration to workflow source

## Prerequisites

```bash
gh auth status
git remote get-url origin
```

Derive repo identity and the GitHub Pages base URL:

```bash
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
OWNER=$(echo "$REPO" | cut -d/ -f1)
REPO_NAME=$(echo "$REPO" | cut -d/ -f2)
SITE_URL="https://${OWNER}.github.io"
BASE="/${REPO_NAME}"
```

## Step 1 — Locate the static site and detect framework

Search for framework config files from the repo root. Check common locations (`docs/`, `apps/web/`, `apps/docs/`, `website/`, `.`):

<!-- TODO: extract to scripts/detect-framework.mts -->

| Framework | Signal file(s) | Build output |
|---|---|---|
| Astro | `astro.config.{mjs,ts,js}` | `dist/` |
| VitePress | `.vitepress/config.{ts,mts,js}` | `.vitepress/dist/` |
| VuePress v2 | `.vuepress/config.{ts,js}` | `.vuepress/dist/` |
| Vite (plain) | `vite.config.{ts,js}` (no framework match) | `dist/` |
| Next.js static | `next.config.{js,mjs,ts}` + `output: 'export'` in config | `out/` |
| Create React App | `package.json` with `react-scripts` | `build/` |
| Jekyll | `_config.yml` | `_site/` |
| Hugo | `hugo.toml` or `config.toml` with `baseURL` | `public/` |

Record:
- `SITE_DIR` — directory containing the config file
- `DIST_DIR` — build output path relative to repo root (e.g. `apps/web/dist`)
- `BUILD_CMD` — command to build the site (e.g. `pnpm --filter web build`)

If no framework is detected, ask the user for the build command and output directory before continuing.

## Step 2 — Configure framework base path

Update the framework config to set the canonical site URL and subpath. Skip if already set.

**Astro** (`astro.config.*`) — add inside `defineConfig({`:
```js
site: 'https://<OWNER>.github.io',
base: '/<REPO_NAME>',
```

**VitePress** (`.vitepress/config.*`) — add to the config object:
```ts
base: '/<REPO_NAME>/',
```

**VuePress v2** (`.vuepress/config.*`) — add to the config object:
```ts
base: '/<REPO_NAME>/',
```

**Vite (plain)** (`vite.config.*`) — add inside `defineConfig({`:
```ts
base: '/<REPO_NAME>/',
```

**Next.js static** (`next.config.*`) — add to the config object:
```js
basePath: '/<REPO_NAME>',
assetPrefix: '/<REPO_NAME>/',
```

**Create React App** (`package.json`) — add top-level field:
```json
"homepage": "https://<OWNER>.github.io/<REPO_NAME>"
```

**Jekyll** (`_config.yml`) — add or update:
```yaml
baseurl: "/<REPO_NAME>"
url: "https://<OWNER>.github.io"
```

**Hugo** (`hugo.toml` / `config.toml`) — update:
```toml
baseURL = "https://<OWNER>.github.io/<REPO_NAME>/"
```

## Step 3 — Detect package manager and build context

```bash
# Check for lock files in order of priority
[ -f pnpm-lock.yaml ] && PM=pnpm
[ -f yarn.lock ]      && PM=yarn
[ -f bun.lockb ]      && PM=bun
[ -z "$PM" ]          && PM=npm
```

Determine if monorepo (turbo.json, nx.json, or `workspaces` in root package.json). Adjust `BUILD_CMD` accordingly:

| Setup | Example BUILD_CMD |
|---|---|
| pnpm monorepo, filter by dir | `pnpm --filter web build` |
| npm/yarn workspaces | `npm run build --workspace=apps/web` |
| Single package | `$PM run build` |

## Step 4 — Create the deploy workflow

Create `.github/workflows/deploy-pages.yml`. Skip if file already exists and `build_type` is `workflow`.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [<DEFAULT_BRANCH>]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # <PACKAGE_MANAGER_SETUP>   # see table below
      - uses: actions/configure-pages@v5
      - run: <INSTALL_CMD>
      - run: <BUILD_CMD>
      - uses: actions/upload-pages-artifact@v3
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
        uses: actions/deploy-pages@v4
```

**Package manager setup step** — insert after `actions/checkout@v4`:

| PM | Step(s) to insert |
|---|---|
| pnpm | `uses: pnpm/action-setup@v4` with `version: <version from packageManager field>`, then `uses: actions/setup-node@v4` with `cache: pnpm` |
| yarn | `uses: actions/setup-node@v4` with `cache: yarn` |
| bun | `uses: oven-sh/setup-bun@v2` |
| npm | `uses: actions/setup-node@v4` with `cache: npm` |

Read `engines.node` from `package.json` for the Node version; default to `'22'` if absent. Read `packageManager` field for pnpm version; default to `'latest'` if absent.

## Step 5 — Enable GitHub Pages via API

Check current state:

```bash
gh api "repos/$REPO/pages" 2>/dev/null | jq '{build_type, html_url}'
```

If Pages is not yet enabled:

```bash
gh api "repos/$REPO/pages" --method POST --field build_type=workflow
```

If Pages is enabled but using branch source:

```bash
gh api "repos/$REPO/pages" --method PUT --field build_type=workflow
```

Verify:

```bash
gh api "repos/$REPO/pages" --jq '{build_type, html_url, status}'
```

Expected: `build_type: "workflow"`.

## Step 6 — Summary

Print:

```
## GitHub Pages setup complete

### Configured
- [x] Framework base path: <site URL><base>
- [x] Deploy workflow: .github/workflows/deploy-pages.yml
- [x] GitHub Pages source: workflow

### Site URL
https://<OWNER>.github.io/<REPO_NAME>/

### Next step
Push to <DEFAULT_BRANCH> to trigger the first deploy, or run the workflow manually from the Actions tab.
```

## Anti-patterns

- Do not set `build_type=legacy` (branch source) — it requires a committed `dist/` branch and makes the workflow redundant.
- Do not hardcode the package manager or Node version without checking `package.json` first.
- Do not assume the site lives at the repo root — always detect `SITE_DIR`.
- Do not skip Step 2 — missing `base` causes broken asset paths when the site is served from a subdirectory.
