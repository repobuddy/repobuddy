# website init

Adds a documentation site to a monorepo as a private workspace package. The site builds with the repo's
task runner, stays out of the lint and dead-code checks it would otherwise break, and deploys on its own
workflow. The default is [Starlight](https://starlight.astro.build) on Astro. Use plain Astro only when the
user asks for a marketing or landing site rather than docs.

Reference layout: [`cyberuni/cyber-sdd`](https://github.com/cyberuni/cyber-sdd), whose `apps/web` is a
Starlight site published to GitHub Pages.

## When to use

- A monorepo has no website and the user wants docs, a landing page, or a GitHub Pages site for it
- The user wants to move docs from the root readme into a site

Do not use this command for a single-package repo. Scaffold there with `npm create astro@latest` instead.
If an `astro.config.*` already exists anywhere outside `node_modules`, stop and ask. The repo already has
a site, and the job is to fix or extend it.

## Step 1: Detect the monorepo

Read these files from the repo root and record what they show:

| Fact | Where to look |
|---|---|
| `PM` (package manager) | `packageManager` in root `package.json`, then the lockfile (`pnpm-lock.yaml`, `yarn.lock`, `bun.lock`, `package-lock.json`) |
| Workspace globs | `pnpm-workspace.yaml` `packages:`, or `workspaces` in root `package.json` |
| Task runner | `turbo.json`, `nx.json`, or none |
| `SCOPE` | the npm scope most workspace packages share (`@cyberuni/…` gives `@cyberuni`) |
| Root TypeScript major | `typescript` in root `package.json` devDependencies |
| Release-age gate | `minimumReleaseAge` in `pnpm-workspace.yaml`, `npmMinimalAgeGate` in `.yarnrc.yml`, `min-release-age` in `.npmrc`, `minimumReleaseAge` in `bunfig.toml` |
| Checks that scan every workspace | `biome.json`, `knip.json`, `eslint.config.*`, a `.changeset/` directory |
| `REPO` and default branch | `git remote get-url origin`, `git symbolic-ref refs/remotes/origin/HEAD` |

## Step 2: Choose the location and name

Pick `SITE_DIR` by the first rule that matches:

1. The user named a directory. Use it.
2. A workspace glob is `apps/*`. Use `apps/web`, which is the cyber-sdd layout.
3. Otherwise, use `website/` and add it to the workspace globs.

Name the package `<SCOPE>/web`, or `web` when the repo has no scope. Mark it `"private": true`. The site
is never published to npm.

Confirm `SITE_DIR` and the package name with the user before writing files.

## Step 3: Resolve versions

Do not copy version numbers from these templates or from cyber-sdd. Look them up:

```bash
npm view astro version
npm view @astrojs/starlight version
npm view @astrojs/check version
npm view @astrojs/starlight peerDependencies.astro
```

- Starlight pins a supported Astro range. Choose the Astro version inside it, not the newest Astro.
- If the repo has a release-age gate, choose versions published before the window. Check with
  `npm view <pkg> time --json`. A version that is too new fails install with
  `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION` or the equivalent error for the package manager.
- `@astrojs/check` loads the TypeScript compiler API. The native TypeScript 7 compiler does not provide
  that API. If the root is on TypeScript 7, give the site its own `typescript` devDependency on the
  latest 6.x.
- Follow the repo's range style. If other packages use exact pins, pin exactly. If they use `^`, use `^`.

## Step 4: Scaffold the package

Copy the skill's `assets/site/` directory into `SITE_DIR` and replace every `<PLACEHOLDER>` in the copies:

| File | What to fill in |
|---|---|
| `package.json` | Package name and the versions from Step 3. If the task runner has no `typecheck` task, rename the script to the task the repo uses, or run `astro check && astro build` in `build` |
| `astro.config.mjs` | `site`, `base`, title, repo, default branch, and `SITE_DIR` |
| `tsconfig.json` | Nothing. It extends Astro's config, not the repo's base tsconfig, because the repo base usually sets `module` or `lib` options that conflict with Astro |
| `src/content.config.ts`, `src/env.d.ts` | Nothing |
| `src/content/docs/index.mdx` | Title, pitch, and tagline for the splash page |

Set `site` and `base` for the deploy target now, because a wrong base breaks every asset path. For a
GitHub project site, `site` is `https://<OWNER>.github.io` and `base` is `/<REPO_NAME>`. For a
`<OWNER>.github.io` repo or a custom domain, remove `base` and the `/<REPO_NAME>` prefix in `index.mdx`.

The `autogenerate` sidebar lists every page in a directory, so a new page cannot be left out. cyber-sdd
lists pages by hand instead, which controls the order. Change to an explicit list when the order matters.

Then write `src/content/docs/guides/getting-started.md`, the page the splash links to. Write its content
from the repo's readme. Do not leave placeholder text in it.

### Internal links and `base`

Astro does not add `base` to links written in Markdown or in frontmatter. A link such as
`/guides/getting-started/` returns 404 once the site is served under `/<REPO_NAME>/`. Write internal links
either as paths relative to the current page or with the base included
(`/<REPO_NAME>/guides/getting-started/`), as the hero `link` in `index.mdx` does. Choose one form and use it
everywhere.

## Step 5: Wire the site into the monorepo

Change only the files that exist. Each change stops a check from failing on files the site generates.

| File | Change |
|---|---|
| Workspace globs | Add `SITE_DIR` if no glob matches it |
| `turbo.json` | Add `.astro/**` beside `dist/**` in the `build` outputs. Add a `dev` task with `"persistent": true, "cache": false` if none exists |
| `nx.json` | Add `{projectRoot}/dist` and `{projectRoot}/.astro` to the `build` target's outputs |
| `.gitignore` | Add `<SITE_DIR>/.astro`. Check that `dist` is already ignored |
| `biome.json` | Add `"!**/.astro"` to `files.includes` |
| `eslint.config.*` | Add `**/.astro/**` to the ignores |
| `knip.json` | Add a workspace entry for `SITE_DIR` with `entry` and `project` set to `["src/**/*.{astro,ts,mdx}"]`. Without it, knip reports the Astro dependencies as unused |
| `pnpm-workspace.yaml` | pnpm 10 and later skip install scripts, and the site does not build without them. On pnpm 11, add `esbuild: true` and `sharp: true` under `allowBuilds`, because pnpm 11 ignores `onlyBuiltDependencies`. On pnpm 10, add both to `onlyBuiltDependencies` |
| `.changeset/config.json` | Nothing is needed when `privatePackages.version` is `false`. Otherwise add the package name to `ignore`, so a site-only change does not require a changeset |
| Root `package.json` | Add `"web": "turbo run --filter=<SCOPE>/web"`, so that `<PM> web dev` and `<PM> web build` work from the root. Without turbo, use `<PM> --filter <SCOPE>/web` |

## Step 6: Deploy

For GitHub Pages, run the `setup-github-pages` skill if it is installed. Give it `SITE_DIR`,
`<SITE_DIR>/dist`, and `<PM> --filter <SCOPE>/web build`. `site` and `base` are already set in Step 4.

Then add a `paths` filter to the workflow's `push` trigger, so that only site changes start a deploy:

```yaml
on:
  push:
    branches: [<DEFAULT_BRANCH>]
    paths:
      - '<SITE_DIR>/**'
      - '.github/workflows/deploy-docs.yml'
  workflow_dispatch:
```

If the site renders content from other workspaces, such as a package readme or a skills directory, add
those paths to the filter as well.

For another host, set `site` and `base` for that host and give the user the build command and the output
directory.

## Step 7: Record the site in AGENTS.md

Add the site to the repo's architecture or layout section, for example
``- `apps/web/` — the Astro docs site published to GitHub Pages``, and add the `web` commands to the
commands section. If the repo has no `AGENTS.md`, skip this step.

## Step 8: Verify

Run each command from the repo root. Each one must pass:

```bash
<PM> install
<PM> --filter <SCOPE>/web build
<PM> --filter <SCOPE>/web typecheck
```

Then run the repo's own checks (lint, knip, the full verify script) to confirm that Step 5 left none of
them failing. Open `<SITE_DIR>/dist/index.html` and check that asset URLs start with `base`. Report the
dev command and the URL where the site will deploy.

## Anti-patterns

- Do not make the site extend the repo's base tsconfig or TypeScript 7 toolchain. `astro check` needs the
  TypeScript 6 compiler API.
- Do not publish the site package. It is `private`.
- Do not leave `base` unset for a GitHub project site. The pages load without CSS or JavaScript.
- Do not write root-absolute internal links without `base`.
- Do not bump Astro past the range that Starlight's `peerDependencies` allows.
