# website

A router skill for a repository's documentation website. It picks the command that fits the request and follows that command's instructions.

## Commands

### `init`

Adds an Astro docs site to a monorepo as its own private workspace package. The package is wired into the task runner, the lint and dead-code checks, and a deploy workflow. It is modeled on the `apps/web` Starlight site in [`cyberuni/cyber-sdd`](https://github.com/cyberuni/cyber-sdd).

1. Detects the package manager, workspace globs, task runner, npm scope, and any release-age gate
2. Picks the site directory: `apps/web` when `apps/*` is a workspace, otherwise `website/`
3. Looks up current Astro, Starlight, and `@astrojs/check` versions inside Starlight's peer range and the repo's release-age window
4. Scaffolds a Starlight site with `site` and `base` already set for the deploy target
5. Updates turbo/nx outputs, `.gitignore`, biome, eslint, knip, pnpm build-script approvals, and changesets so no check fails on the new package
6. Runs `deploy` for the repo's git host
7. Records the site in `AGENTS.md`, then builds and type-checks it

It produces a private `<scope>/web` package with a splash page and a first guide written from the readme, the monorepo config edits that package needs, a deploy job, and a root `web` script for `dev` and `build`.

### `deploy`

Publishes a static site from CI to the static hosting of the repo's git host. It works with Astro, VitePress, VuePress, Vite, Next.js static export, Create React App, Jekyll, and Hugo.

| Host | Hosting | CI |
|---|---|---|
| GitHub | GitHub Pages | GitHub Actions |
| GitLab | GitLab Pages | GitLab CI |
| Codeberg | Codeberg Pages (git-pages) | Forgejo Actions |
| Bitbucket Cloud | `<workspace>.bitbucket.io` | Bitbucket Pipelines |
| Azure DevOps | Azure Static Web Apps | Azure Pipelines |

1. Detects the git host from the remote
2. Finds the site, its framework, and its build output
3. Works out the base path the host serves the site at, including GitLab's unique domain setting, and sets it in the framework config
4. Writes the CI job, limited to changes under the site directory
5. Turns on hosting where the host has a switch for it, and checks the result

Self-hosted Forgejo and Gitea have no built-in static hosting. For those, it sets the base path and hands the build command and the output directory to the external host the user picks. Tokens that only the user can create (Bitbucket, Azure) are reported as manual steps.

## How to invoke

Run `/website init` where slash commands are supported, or ask directly, for example "add a docs website to this monorepo" or "set up Starlight in apps/web". Run `/website deploy`, or ask "publish the docs to GitLab Pages". A bare `/website` lists the commands.
