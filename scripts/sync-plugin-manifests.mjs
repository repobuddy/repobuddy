#!/usr/bin/env node
/**
 * Carries the version `changeset version` just wrote into the universal plugin: the canonical
 * `packages/buddy/plugin.json` and its derived vendor manifests (`.claude-plugin/`,
 * `.cursor-plugin/`, `.codex-plugin/`).
 *
 * Run as part of the root `version` script (`changeset version && node
 * scripts/sync-plugin-manifests.mjs`), after changesets has already bumped
 * `packages/buddy/package.json`.
 *
 * Uses `universal-plugin plugin version --from-package`: it carries the number changesets wrote
 * into `package.json` into the canonical manifest, stamps every `npx repobuddy@<version>` pin in
 * the skills, and rebuilds the vendor manifests. The tool's version is the `universal-plugin`
 * devDependency of `packages/buddy`. This repository carries no marketplace catalog: the plugin
 * is listed in `cyber-uni/marketplace`, so the tool has no catalog here to refresh.
 *
 * The tool's own writer also formats JSON arrays one element per line, which disagrees with this
 * repo's biome style (inline arrays under biome's line-width limit) and would otherwise fail
 * `pnpm check` on every touched manifest. `pnpm format` reconciles that at the end.
 */

import { execFileSync } from 'node:child_process'

// `universal-plugin` is a devDependency of `packages/buddy`, so `pnpm exec` runs the version the
// lockfile pins. `exec` runs in the package directory, hence `--root .`.
execFileSync(
	'pnpm',
	['--filter', 'repobuddy', 'exec', 'universal-plugin', 'plugin', 'version', '--from-package', '--root', '.'],
	{ stdio: 'inherit' },
)

execFileSync('pnpm', ['format'], { stdio: 'inherit' })
