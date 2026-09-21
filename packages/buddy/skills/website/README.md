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
6. Hands off to `setup-github-pages` and adds a `paths` filter, so only site changes start a deploy
7. Records the site in `AGENTS.md`, then builds and type-checks it

It produces a private `<scope>/web` package with a splash page and a first guide written from the readme, the monorepo config edits that package needs, a GitHub Pages deploy workflow, and a root `web` script for `dev` and `build`.

## How to invoke

Run `/website init` where slash commands are supported, or ask directly, for example "add a docs website to this monorepo" or "set up Starlight in apps/web". A bare `/website` lists the commands.
