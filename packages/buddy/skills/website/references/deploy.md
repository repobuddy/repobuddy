# website deploy

Deploys a repository's static site from CI to the static hosting of the repo's own git host. It sets
the site's base path to match the URL the host serves it at. Idempotent: it checks the current state
before changing anything.

## When to use

- A repo has a static site (in a monorepo subdirectory or at the root) that is not deployed yet
- The site moves to a different host, or a deploy is broken because of a wrong base path
- `website init` has scaffolded a site and hands off here

## Step 1: Detect the git host

Read the host from `git remote get-url origin`:

| Remote host | `HOST` | Instructions |
|---|---|---|
| `github.com` or GitHub Enterprise | `github` | [deploy-github.md](deploy-github.md) |
| `gitlab.com` or self-managed GitLab | `gitlab` | [deploy-gitlab.md](deploy-gitlab.md) |
| `codeberg.org` | `codeberg` | [deploy-codeberg.md](deploy-codeberg.md) |
| `bitbucket.org` | `bitbucket` | [deploy-bitbucket.md](deploy-bitbucket.md) |
| `dev.azure.com` or `*.visualstudio.com` | `azure` | [deploy-azure.md](deploy-azure.md) |

When the hostname does not say which product it runs (a self-hosted instance), run the `init-buddy`
skill's detection with `--probe` if it is installed, or ask the user.

A self-hosted Forgejo or Gitea instance has no built-in static hosting. Neither does a host the table
does not list. In both cases, ask the user which external host to use (Cloudflare Pages, Netlify,
Vercel, or another). Complete Steps 2 to 4 with the base path that host serves at, usually `/`. Then give
the user the build command and the output directory, and point them to that host's setup guide.

If the user names a host other than the repo's own, use that host instead.

The host's CLI must be installed and logged in for the enablement steps. If it is missing, run the
`init-buddy` skill when it is installed. Otherwise, tell the user to install and log in.

## Step 2: Locate the site and its framework

Search for framework config files. Check common locations first (`apps/web/`, `apps/docs/`, `website/`,
`docs/`, `.`):

| Framework | Signal file(s) | Build output |
|---|---|---|
| Astro | `astro.config.{mjs,ts,js}` | `dist/` |
| VitePress | `.vitepress/config.{ts,mts,js}` | `.vitepress/dist/` |
| VuePress v2 | `.vuepress/config.{ts,js}` | `.vuepress/dist/` |
| Vite (plain) | `vite.config.{ts,js}` (no framework match) | `dist/` |
| Next.js static | `next.config.{js,mjs,ts}` with `output: 'export'` | `out/` |
| Create React App | `package.json` with `react-scripts` | `build/` |
| Jekyll | `_config.yml` | `_site/` |
| Hugo | `hugo.toml`, or `config.toml` with `baseURL` | `public/` |

Record:

- `SITE_DIR`: the directory that holds the config file
- `DIST_DIR`: the build output path relative to the repo root, for example `apps/web/dist`

If no framework is found, ask the user for the build command and the output directory.

## Step 3: Work out the build command

Pick `PM` from the root `package.json` `packageManager` field, then from the lockfile (`pnpm-lock.yaml`,
`yarn.lock`, `bun.lock` or `bun.lockb`, otherwise npm). Read the Node version from `engines.node`, and
use `22` if it is not set.

| Setup | Example `BUILD_CMD` |
|---|---|
| pnpm workspace | `pnpm --filter <package-name> build` |
| npm or yarn workspaces | `npm run build --workspace=<SITE_DIR>` |
| bun workspace | `bun run --filter <package-name> build` |
| Single package | `<PM> run build` |

Record `INSTALL_CMD` as the lockfile-strict install: `pnpm install --frozen-lockfile`, `yarn install
--immutable`, `bun install --frozen-lockfile`, or `npm ci`.

## Step 4: Set the base path

The host's instructions give `SITE_URL` (the origin, for example `https://owner.github.io`) and `BASE`
(the path the site is served under, for example `/repo`, or `/`). Set them in the framework config. Skip
a value that is already correct.

| Framework | File | Setting |
|---|---|---|
| Astro | `astro.config.*` | `site: '<SITE_URL>'` and `base: '<BASE>'` in `defineConfig` |
| VitePress | `.vitepress/config.*` | `base: '<BASE>/'` |
| VuePress v2 | `.vuepress/config.*` | `base: '<BASE>/'` |
| Vite (plain) | `vite.config.*` | `base: '<BASE>/'` in `defineConfig` |
| Next.js static | `next.config.*` | `basePath: '<BASE>'` and `assetPrefix: '<BASE>/'` |
| Create React App | `package.json` | `"homepage": "<SITE_URL><BASE>/"` |
| Jekyll | `_config.yml` | `baseurl: "<BASE>"` and `url: "<SITE_URL>"` |
| Hugo | `hugo.toml` or `config.toml` | `baseURL = "<SITE_URL><BASE>/"` |

`SITE_URL` is the origin alone. A path in Astro's `site` (for example `https://owner.github.io/repo`) does
not prefix asset URLs, so move it into `base`.

When `BASE` is `/`, write `/` for the path settings, leave out Astro's `base`, and do not double the
slash in full URLs.

A wrong base does not fail the build. The pages load without CSS or JavaScript, so this step is not
optional. Links written in Markdown do not get the base added either. See the internal-links section of
[init.md](init.md).

## Step 5: Create the CI job and enable hosting

Follow the host's instructions file from Step 1. Each one covers the CI config, the switch that turns
hosting on, and the check that it is on.

Every host's CI config can limit deploys to changes under `SITE_DIR`. Add that filter when the site
lives in a monorepo, and include the CI file itself and any directory the site renders content from.

## Step 6: Summary

Report:

```
## Website deploy set up

- Host: <HOST> (<hosting product>)
- Base path: <SITE_URL><BASE>
- CI config: <file>
- Hosting: enabled

Site URL: <SITE_URL><BASE>/

Next: push to <DEFAULT_BRANCH> to start the first deploy, or run the job by hand.
```

Report any manual step the host needs, such as a secret the user must add, as not done.

## Anti-patterns

- Do not hardcode the package manager or the Node version. Read them from `package.json`.
- Do not assume the site is at the repo root. Always find `SITE_DIR`.
- Do not commit build output to the default branch to publish it.
