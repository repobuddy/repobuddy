import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from '@jest/globals'
import { detect } from './detect.js'

function gitRepo(remotes: [string, string][]): string {
	const dir = mkdtempSync(join(tmpdir(), 'detect-'))
	execFileSync('git', ['-C', dir, 'init', '-q'])
	for (const [name, url] of remotes) execFileSync('git', ['-C', dir, 'remote', 'add', name, url])
	return dir
}

// An empty PATH (rather than the real one) so `which()` never finds a real `gh`/`glab`/etc. on this
// machine: running a real CLI would be a non-hermetic side effect (real auth state, files written
// under the real HOME when the child's env omits it) and would make the assertions non-deterministic.
const sandboxedEnv = { PATH: '' }

test('detect: orchestrates os, managers, hosts, and mcp for a real repo', async () => {
	const dir = gitRepo([['origin', 'git@github.com:acme/widgets.git']])
	const result = await detect({ dir, env: sandboxedEnv })
	assert.equal(result.dir, dir)
	assert.ok(result.os.platform)
	assert.ok(Array.isArray(result.managers))
	assert.equal(result.hosts[0]?.hostname, 'github.com')
	assert.ok(result.hosts[0]?.cli)
	assert.ok(Array.isArray(result.mcp))
})

test('detect: --host requested and no probe, sandboxed env', async () => {
	const dir = gitRepo([])
	const result = await detect({ dir, hosts: ['gitlab'], env: sandboxedEnv })
	assert.equal(result.hosts[0]?.kind, 'gitlab')
})
