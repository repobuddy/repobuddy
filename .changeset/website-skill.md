---
'repobuddy': minor
---

New `website` skill, a router for work on a repository's docs website. It has two commands.

`init` adds an Astro/Starlight docs site to a monorepo as a private workspace package, following the
`apps/web` layout of `cyberuni/cyber-sdd`. It picks a location that matches the workspace globs. It
chooses versions within Starlight's Astro peer range and the repo's release-age window, and keeps
`astro check` on TypeScript 6 when the root uses TypeScript 7. It updates turbo, knip, biome,
`.gitignore`, and pnpm build-script approvals so no check fails on the new package, then runs `deploy`.

`deploy` replaces the `setup-github-pages` skill, which is removed. It publishes a static site from CI to
the repo's own git host: GitHub Pages, GitLab Pages, Codeberg Pages, Bitbucket Cloud
(`<workspace>.bitbucket.io`), or Azure Static Web Apps from Azure DevOps. It sets the base path the host
actually serves at, including GitLab's unique domain setting, which serves new sites from the domain
root. Each CI job is limited to changes under the site directory. Invoke it as `/website deploy` where
you used `/setup-github-pages` before.
