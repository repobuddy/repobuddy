---
'repobuddy': minor
---

New `website` skill, a router for work on a repository's docs website. Its first command, `init`, adds
an Astro/Starlight docs site to a monorepo as a private workspace package, following the `apps/web`
layout of `cyberuni/cyber-sdd`.

`init` picks a location that matches the workspace globs. It chooses versions within Starlight's Astro
peer range and the repo's release-age window, and keeps `astro check` on TypeScript 6 when the root uses
TypeScript 7. It sets `site` and `base` before the first build and updates turbo, knip, biome,
`.gitignore`, and pnpm build-script approvals so no check fails on the new package. It then hands the
deploy to `setup-github-pages`, with a `paths` filter so only site changes start a deploy.
