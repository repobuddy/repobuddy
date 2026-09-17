#!/usr/bin/env node
/**
 * Carries the version `changeset version` just wrote into the universal plugin: the canonical
 * `packages/buddy/plugin.json`, its derived vendor manifests (`.claude-plugin/`, `.cursor-plugin/`,
 * `.codex-plugin/`), and the repository's own marketplace catalogs
 * (`.claude-plugin/marketplace.json`, `.github/plugin/marketplace.json`).
 *
 * Run as part of the root `version` script (`changeset version && node
 * scripts/sync-plugin-manifests.mjs`), after changesets has already bumped
 * `packages/buddy/package.json`.
 *
 * Uses `universal-plugin publish sync-version` (the changesets-repo command: it carries the
 * released number from `package.json` into the canonical manifest — never `plugin version`,
 * which would pick a number changesets is about to pick again) and `universal-plugin plugin
 * build` (regenerates the vendor manifests and, as a side effect, the two local marketplace
 * catalogs). The npx version is pinned so a release always runs the same tool.
 *
 * `plugin build`'s catalog generation only ever emits a `./`-relative local-path `source`
 * (confirmed against the tool's own marketplace/init spec) — it has no concept of an npm-package
 * source. This repo deliberately ships its Claude Code/Codex catalog entry from the published
 * `repobuddy` npm package rather than this repository, so that entry's `source` carries the
 * built, gitignored skill script bundles that only the npm tarball has. `plugin build` cannot
 * express that, so this restores it after every rebuild.
 *
 * The tool's own writer also formats JSON arrays one element per line, which disagrees with this
 * repo's biome style (inline arrays under biome's line-width limit) and would otherwise fail
 * `pnpm check` on every touched manifest. `pnpm format` reconciles that at the end.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const UNIVERSAL_PLUGIN = 'universal-plugin@0.8.0'
const PLUGIN_ROOT = 'packages/buddy'
const CLAUDE_CATALOG = '.claude-plugin/marketplace.json'
const NPM_SOURCE = { source: 'npm', package: 'repobuddy' }

function run(args) {
	execFileSync('npx', [UNIVERSAL_PLUGIN, ...args], { stdio: 'inherit' })
}

run(['publish', 'sync-version', '--root', PLUGIN_ROOT])
run(['plugin', 'build', '--root', PLUGIN_ROOT])

const catalog = JSON.parse(readFileSync(CLAUDE_CATALOG, 'utf-8'))
const entry = catalog.plugins.find((p) => p.name === 'repobuddy')
if (!entry) {
	throw new Error(`${CLAUDE_CATALOG} has no "repobuddy" plugin entry to restore the npm source on`)
}
entry.source = NPM_SOURCE
writeFileSync(CLAUDE_CATALOG, `${JSON.stringify(catalog, undefined, '\t')}\n`)

console.log(`restored npm source in ${CLAUDE_CATALOG}`)

execFileSync('pnpm', ['format'], { stdio: 'inherit' })
