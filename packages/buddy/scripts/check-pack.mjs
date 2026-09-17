#!/usr/bin/env node
/**
 * Confirm the packed tarball carries every built skill script and that each one runs on its own.
 *
 *   node scripts/check-pack.mjs
 *
 * The skill scripts are build output: gitignored, and shipped only in the npm package. This packs the
 * package, unpacks it into a temp directory with no node_modules, and runs each script there.
 *
 * Exit 0 when every script is present and runs, 1 otherwise.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)))

/** Each built script, and an invocation that proves it starts: the exit code it must return. */
const SCRIPTS = [
	{ path: 'skills/min-release-age/scripts/min-release-age.mjs', args: ['no-such-command'], exit: 2 },
	{ path: 'skills/init-buddy/scripts/detect-env.mjs', args: ['--json', '--host', 'github'], exit: 0 },
	// These reject bad usage before shelling out to `gh`, so they run without a git remote or auth.
	{ path: 'skills/setup-github-repo/scripts/detect-state.mjs', args: ['--dir'], exit: 1 },
	{ path: 'skills/setup-github-repo/scripts/scaffold-workflows.mjs', args: ['no-such-command'], exit: 1 },
	{ path: 'skills/setup-npm-trusted-publishing/scripts/npm-trust.mjs', args: ['no-such-command'], exit: 2 },
]

const temp = mkdtempSync(join(tmpdir(), 'repobuddy-pack-'))
const failures = []
try {
	const pack = spawnSync('pnpm', ['pack', '--pack-destination', temp], { cwd: packageDir, encoding: 'utf8' })
	if (pack.status !== 0) throw new Error(`pnpm pack failed:\n${pack.stderr}`)
	const tarball = readdirSync(temp).find((f) => f.endsWith('.tgz'))
	if (!tarball) throw new Error('pnpm pack produced no tarball')
	const untar = spawnSync('tar', ['-xzf', tarball], { cwd: temp, encoding: 'utf8' })
	if (untar.status !== 0) throw new Error(`tar failed:\n${untar.stderr}`)

	for (const { path, args, exit } of SCRIPTS) {
		const file = join(temp, 'package', path)
		if (!existsSync(file)) {
			failures.push(`${path}: missing from the tarball (run \`pnpm build\` first)`)
			continue
		}
		const run = spawnSync('node', [file, ...args], { cwd: temp, encoding: 'utf8' })
		if (run.status !== exit) {
			failures.push(`${path}: exited ${run.status}, expected ${exit}\n${run.stderr.trim()}`)
		}
	}
} catch (error) {
	failures.push(error instanceof Error ? error.message : String(error))
} finally {
	rmSync(temp, { recursive: true, force: true })
}

if (failures.length) {
	process.stderr.write(`pack check failed:\n${failures.map((f) => `- ${f}`).join('\n')}\n`)
	process.exit(1)
}
process.stdout.write(`pack check passed: ${SCRIPTS.length} skill scripts present and runnable\n`)
