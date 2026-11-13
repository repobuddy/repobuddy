---
description: How the website skill changes an existing docs site — pages, sidebar, versions, and config — without breaking its build or deploy.
---

## Purpose

Changes a repository's existing documentation site: adds, moves, or removes pages, updates the sidebar,
upgrades the site's framework packages, or changes its config. It keeps the site building, type-checking,
and deploying as it did before the change.

## When to use

- The repo already has a site (an `astro.config.*`, or another framework's config, outside `node_modules`)
  and the user wants it changed
- A package's commands, options, or exports changed and its docs pages need to follow

Do not use it to publish a site that is not deployed yet, or to fix a wrong base path. Use the
`website.deploy` reference for those. Do not use it when the repo has no site. Use the `website.init`
reference instead.

## Step 1: Locate the site

Find `SITE_DIR`, the framework, and the build command the way Steps 2 and 3 of the `website.deploy`
reference do. Read the repo's `AGENTS.md` for where the site lives and how its pages are organized; when
it names a docs guide for the site, follow that guide over this reference.

Record `SITE_URL` and `BASE` from the framework config.

## Step 2: Make the change

| Change | What to do |
|---|---|
| Add a page | Write it under the content directory, in the section its topic belongs to. If the sidebar is an explicit list, add an entry, or the page ships unreachable |
| Move or rename a page | Move the file, update the sidebar, and update every internal link to it. Search the content directory for the old path |
| Remove a page | Delete it, remove its sidebar entry, and fix every internal link to it |
| Docs for a changed package | Update the page from the package's source (its exports, options, commands), not from its readme |
| Upgrade framework packages | Resolve versions as Step 3 of the `website.init` reference does: inside Starlight's `peerDependencies` range for Astro, and outside the repo's release-age window |
| Change `site`, `base`, or the host | Use the `website.deploy` reference |

Write internal links in the form the site already uses: relative to the page, or with `BASE` included.
Astro does not add `base` to links written in Markdown or in frontmatter.

## Step 3: Verify

Run the site's build and type-check from the repo root. Each must pass. Then check that:

- every new or moved page is reachable from the sidebar or a link
- no internal link points at a removed or old path
- asset URLs in the built `index.html` still start with `BASE`

Report the pages changed and the command to preview the site.

## Anti-patterns

- Do not run the `website.init` steps on a repo that already has a site.
- Do not bump Astro past the range that Starlight's `peerDependencies` allows.
- Do not write root-absolute internal links without `BASE`.
