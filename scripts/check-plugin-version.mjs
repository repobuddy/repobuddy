#!/usr/bin/env node
/**
 * Fails `pnpm verify` when the universal plugin's version has drifted from
 * `packages/buddy/package.json` — the mistake that let `packages/buddy/plugin.json` (and every
 * file derived from it) sit at 1.3.2 while the package moved to 1.8.0, so `claude plugin update
 * repobuddy@repobuddy` reported "already at the latest version" and never installed the update.
 *
 * `universal-plugin` ships no published check command for this (its `doctor` diagnostics live
 * only in a skill's bundled script, not the npm CLI's command tree), so this compares the
 * versions directly. Run `pnpm version` (which chains `node scripts/sync-plugin-manifests.mjs`)
 * to resync everything this checks.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PLUGIN_ROOT = 'packages/buddy'

function readJson(path) {
	return JSON.parse(readFileSync(path, 'utf-8'))
}

function pluginEntryVersion(catalogPath) {
	const catalog = readJson(catalogPath)
	const entry = catalog.plugins.find((p) => p.name === 'repobuddy')
	return entry?.version
}

const expected = readJson(join(PLUGIN_ROOT, 'package.json')).version

const actual = {
	[join(PLUGIN_ROOT, 'plugin.json')]: readJson(join(PLUGIN_ROOT, 'plugin.json')).version,
	[join(PLUGIN_ROOT, '.claude-plugin/plugin.json')]: readJson(join(PLUGIN_ROOT, '.claude-plugin/plugin.json')).version,
	[join(PLUGIN_ROOT, '.cursor-plugin/plugin.json')]: readJson(join(PLUGIN_ROOT, '.cursor-plugin/plugin.json')).version,
	[join(PLUGIN_ROOT, '.codex-plugin/plugin.json')]: readJson(join(PLUGIN_ROOT, '.codex-plugin/plugin.json')).version,
	'.claude-plugin/marketplace.json': pluginEntryVersion('.claude-plugin/marketplace.json'),
	'.github/plugin/marketplace.json': pluginEntryVersion('.github/plugin/marketplace.json'),
}

const mismatches = Object.entries(actual).filter(([, version]) => version !== expected)

if (mismatches.length > 0) {
	console.error(`plugin version drift: packages/buddy/package.json is ${expected}, but:`)
	for (const [file, version] of mismatches) {
		console.error(`  ${file}: ${version ?? '(missing)'}`)
	}
	console.error('Run `pnpm version` to resync (or `node scripts/sync-plugin-manifests.mjs` directly).')
	process.exit(1)
}

console.log(`plugin version in sync at ${expected}`)
