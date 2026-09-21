---
name: website
description: Use this skill when adding or deploying a docs website — `init` scaffolds Astro in a monorepo, `deploy` publishes it.
---

# Website

A router for work on a repository's documentation website. It picks the command that fits the request,
then loads that command's instructions and follows them. It does no work itself.

## Commands

| Command | Use it when | Instructions |
|---|---|---|
| `init` | The monorepo has no website, and the user wants docs or a landing page | [references/init.md](references/init.md) |
| `deploy` | A static site exists and should be published from CI: GitHub Pages, GitLab Pages, Codeberg Pages, Bitbucket, or Azure Static Web Apps | [references/deploy.md](references/deploy.md) |

## Routing

1. If the request names a command (`/website init`, "init the website"), load that command's file.
2. If it does not, match the request to the **Use it when** column. "Add a docs site to this repo" routes
   to `init`. "Publish the docs", "set up GitHub Pages", and "the site loads without CSS" route to `deploy`.
3. Before routing to `init`, look for an `astro.config.*` outside `node_modules`. If one exists, the repo
   already has a site and `init` does not apply. Offer `deploy` if the site is not published yet.
   Otherwise, tell the user no command covers changes to an existing site yet, and ask what they want
   changed.
4. If no command matches, list the commands above and ask which one the user wants. Do not guess.

`init` ends by running `deploy`. `deploy` also runs on its own, for a site that `init` did not create
and for a framework other than Astro.
