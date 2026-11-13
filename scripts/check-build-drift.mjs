#!/usr/bin/env node
/**
 * Fails `pnpm verify` when the build changes a committed skill script. Five bundles listed under
 * `scripts` in `packages/buddy/plugin.json` are built by `universal-plugin plugin build` and also
 * committed, so a skill can run them from a plain checkout. Turbo runs this after `repobuddy#build`.
 *
 * Their bytes depend on the bundler version the lockfile pins. When the lockfile moved
 * universal-plugin's rolldown to 1.2.15, which writes `// <id>` comments instead of
 * `//#region` pairs, nobody rebuilt. Every local build then rewrote all five files.
 * The release PR never fixes this: changesets/action resets the tree before `pnpm run version`,
 * so that PR only stamps the version line.
 *
 * `git diff` compares the working tree with the index, so staged output passes. To fix a failure,
 * run `pnpm --filter repobuddy build` and commit the files it names.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const PLUGIN_ROOT = 'packages/buddy'

const manifest = JSON.parse(readFileSync(join(PLUGIN_ROOT, 'plugin.json'), 'utf-8'))
const scripts = Object.keys(manifest.extensions?.['org.cyberuni.universal-plugin']?.scripts ?? {}).map((path) =>
	join(PLUGIN_ROOT, path),
)

if (scripts.length === 0) process.exit(0)

const changed = execFileSync('git', ['diff', '--name-only', '--', ...scripts], { encoding: 'utf-8' }).trim()

if (changed) {
	console.error('The build changed committed skill scripts:\n')
	console.error(changed.replace(/^/gm, '  '))
	console.error('\nRun `pnpm --filter repobuddy build` and commit these files.')
	process.exit(1)
}

console.log(`${scripts.length} committed skill scripts match the build.`)
