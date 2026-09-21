---
name: website
description: Use this skill when working on a monorepo's docs website. `init` adds an Astro/Starlight site as a workspace package.
---

# Website

A router for work on a repository's documentation website. It picks the command that fits the request,
then loads that command's instructions and follows them. It does no work itself.

## Commands

| Command | Use it when | Instructions |
|---|---|---|
| `init` | The monorepo has no website, and the user wants docs, a landing page, or a GitHub Pages site | [references/init.md](references/init.md) |

## Routing

1. If the request names a command (`/website init`, "init the website"), load that command's file.
2. If it does not, match the request to the **Use it when** column. "Add a docs site to this repo" routes
   to `init`.
3. Before routing to `init`, look for an `astro.config.*` outside `node_modules`. If one exists, the repo
   already has a site. `init` does not apply. Tell the user no command covers changes to an existing site
   yet, and ask what they want changed.
4. If no command matches, list the commands above and ask which one the user wants. Do not guess.

Deploying to GitHub Pages is the `setup-github-pages` skill. `init` hands off to it, and it also runs on
its own.
