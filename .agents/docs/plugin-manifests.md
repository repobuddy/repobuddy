# Plugin manifests and version sync

`packages/buddy/plugin.json` is the canonical manifest (Agent Plugins Specification v1.0.0). The
`.claude-plugin/`, `.cursor-plugin/`, and `.codex-plugin/` manifests beside it are **generated** by
`npx universal-plugin plugin build` — never hand-edit them. Copilot CLI reads `plugin.json` directly.
`packages/buddy/.agents/universal-plugin.json` declares `packagePath: "."`, which this repo's release wiring reads; do
not set `packagePath` in `plugin.json`.

This repository carries no marketplace catalog. The plugin is listed in
[`cyber-uni/marketplace`](https://github.com/cyber-uni/marketplace), which owns its catalog entries and their `source`;
change them there, not here. `plugin build` refreshes only the catalogs that already exist at the repository root, so
do not add one back: a catalog here would be a second install path to keep in sync.

The `version` script runs `universal-plugin plugin version --from-package` after `changeset version` (changesets
decides the number; the command carries it into the manifests and stamps the `npx repobuddy@<version>` pins in the
skills, then rebuilds), using the `universal-plugin` devDependency of `packages/buddy`, then `pnpm format`, since the
tool writes JSON arrays one element per line. `scripts/check-plugin-version.mjs` (`check-plugin-version` in `verify`)
fails when `packages/buddy/package.json`'s version disagrees with the manifest or any vendor manifest.

`plugin build` also bundles the six skill scripts listed under `scripts` in `plugin.json`. Unlike the tsdown bundles,
they are committed, and their bytes follow the rolldown version the lockfile pins for `universal-plugin`.
`scripts/check-build-drift.mjs` (`check-build-drift` in `verify`) rebuilds and fails when any of them differs from git.
After a dependency update changes them, run `pnpm --filter repobuddy build` and commit the result. The release PR will
not do it: changesets/action resets the tree before `pnpm run version`.
