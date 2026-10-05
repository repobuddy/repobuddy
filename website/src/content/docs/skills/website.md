---
title: website
description: Add an Astro and Starlight docs site to a monorepo, or deploy a static site from CI to the repo's git host.
---

`website` is a router for documentation website work. It picks one command and follows that command's instructions.

## When to use

- "add a docs website to this monorepo" or "set up Starlight in apps/web"
- "publish the docs to GitLab Pages" or "the site loads without CSS"

## Invoke

A bare `/website` lists the commands.

| Command | Use it when |
| --- | --- |
| `/website init` | The monorepo has no website. If an `astro.config.*` already exists outside `node_modules`, `init` does not apply and it offers `deploy`. |
| `/website deploy` | A static site exists and should be published from CI. |

### init

Adds a private `<scope>/web` workspace package modeled on the Starlight site in `cyberuni/cyber-sdd`: a splash page and a
first guide written from the readme. It detects the package manager, workspaces, task runner, npm scope, and release-age
gate; picks `apps/web` when `apps/*` is a workspace, otherwise `website/`; and picks Astro, Starlight, and
`@astrojs/check` versions inside Starlight's peer range and the release-age window. It edits turbo or nx outputs,
`.gitignore`, biome, eslint, knip, pnpm build-script approvals, and changesets, adds a root `web` script, runs `deploy`,
records the site in `AGENTS.md`, then builds and type-checks. It confirms the site directory and package name first.

### deploy

Detects the host from the remote, finds the site and its build output, sets the base path the host serves at, writes a
CI job limited to the site directory, and turns on hosting where the host has a switch. It supports Astro, VitePress,
VuePress, Vite, Next.js static export, Create React App, Jekyll, and Hugo.

| Host | Hosting | CI |
| --- | --- | --- |
| GitHub | GitHub Pages | GitHub Actions |
| GitLab | GitLab Pages | GitLab CI |
| Codeberg | Codeberg Pages (git-pages) | Forgejo Actions |
| Bitbucket Cloud | `<workspace>.bitbucket.io` | Bitbucket Pipelines |
| Azure DevOps | Azure Static Web Apps | Azure Pipelines |

Self-hosted Forgejo and Gitea have no built-in static hosting: it sets the base path and hands the build command and
output directory to the host you pick. Tokens only you can create (Bitbucket, Azure) are reported as manual steps.

## Requirements

Node.js and the repo's package manager. Network access to look up package versions. Turning on hosting uses the host's
CLI or API, such as `gh` for GitHub Pages.

## Example

```
/website deploy publish the docs to GitLab Pages
```

More detail: [skill README](https://github.com/repobuddy/repobuddy/tree/main/packages/buddy/skills/website).
