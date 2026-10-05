# Plugin manifests and version sync

`packages/buddy/plugin.json` is the canonical manifest (Agent Plugins Specification v1.0.0). The
`.claude-plugin/`, `.cursor-plugin/`, and `.codex-plugin/` manifests beside it, and the two local marketplace catalogs
(`.claude-plugin/marketplace.json`, `.github/plugin/marketplace.json`), are **generated** by
`npx universal-plugin plugin build` — never hand-edit them, except the Claude catalog's `source` (see below). Copilot
CLI reads `plugin.json` directly. `packages/buddy/.agents/universal-plugin.json` declares `packagePath: "."`, which
this repo's release wiring reads; do not set `packagePath` in `plugin.json`.

The `version` script runs `scripts/sync-plugin-manifests.mjs` after `changeset version`: it runs
`universal-plugin publish sync-version` (never `plugin version` — changesets decides the number), then `plugin build`,
pinned to an exact `universal-plugin` version. `scripts/check-plugin-version.mjs` (`check-plugin-version` in `verify`)
fails when `packages/buddy/package.json`'s version disagrees with the manifest, any vendor manifest, or either
catalog's `repobuddy` entry.

`plugin build` only writes a local-path catalog `source`. This repo ships its Claude Code/Codex catalog entry from the
published `repobuddy` npm package instead (only the tarball carries the built, gitignored skill script bundles), so
`sync-plugin-manifests.mjs` restores that `source` in `.claude-plugin/marketplace.json` after every rebuild — the one
generated field intentionally kept out of sync with the tool's output.
