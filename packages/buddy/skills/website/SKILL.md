---
name: website
description: Adds, deploys, or updates a docs website — `init` scaffolds Astro, `deploy` publishes it, `update` changes it.
metadata:
  setup: true
---

# Website

A router for work on a repository's documentation website. It picks the command that fits the request,
then loads that command's instructions and follows them. It does no work itself.

## Commands

| Command | Use it when | Instructions |
|---|---|---|
| `init` | The monorepo has no website, and the user wants docs or a landing page | `website.init` |
| `deploy` | A static site exists and should be published from CI: GitHub Pages, GitLab Pages, Codeberg Pages, Bitbucket, or Azure Static Web Apps | `website.deploy` |
| `update` | A site exists and the user wants it changed: pages, sidebar, framework versions, or config | `website.update` |

## Instructions

Load the command's instructions, `website.init`, `website.deploy`, or `website.update`, with the
`reference` skill of `cyber-agentkit`, so a plugin's, a repository's, or a user's version applies over
the default. When an instruction names another of these, load it the same way.

When the `reference` command cannot run, read the bundled default in this skill's folder instead:
`references/website.<command>.default.md`. Tell the user that `cyber-agentkit` is not installed, so no
customization applied.

The host files the deploy instructions name, `references/deploy-<host>.md`, and the `assets/site/`
template are in this skill's folder.

## Routing

1. If the request names a command (`/website init`, "init the website"), load that command's
   instructions.
2. If it does not, match the request to the **Use it when** column. "Add a docs site to this repo" routes
   to `init`. "Publish the docs", "set up GitHub Pages", and "the site loads without CSS" route to
   `deploy`. "Add a page to the docs" and "upgrade Starlight" route to `update`.
3. Before routing to `init`, look for an `astro.config.*` outside `node_modules`. If one exists, the repo
   already has a site and `init` does not apply. Offer `deploy` if the site is not published yet, and
   `update` otherwise.
4. If no command matches, list the commands above and ask which one the user wants. Do not guess.

`init` ends by running `deploy`. `deploy` also runs on its own, for a site that `init` did not create
and for a framework other than Astro.
