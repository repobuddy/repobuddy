import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { collectHosts } from './hosts.js'

function gitRepo(remotes: [string, string][]): string {
	const dir = mkdtempSync(join(tmpdir(), 'hosts-'))
	execFileSync('git', ['-C', dir, 'init', '-q'])
	for (const [name, url] of remotes) execFileSync('git', ['-C', dir, 'remote', 'add', name, url])
	return dir
}

let exitSpy: ReturnType<typeof jest.spyOn>
let stderrSpy: ReturnType<typeof jest.spyOn>

beforeEach(() => {
	stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true)
	exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
		throw new Error(`exit:${code}`)
	}) as never)
})

afterEach(() => {
	stderrSpy.mockRestore()
	exitSpy.mockRestore()
	jest.restoreAllMocks()
})

test('collectHosts: from git remotes, known public host and unknown host', async () => {
	const dir = gitRepo([
		['origin', 'git@github.com:acme/widgets.git'],
		['upstream', 'https://gitlab.com/acme/widgets.git'],
		['other', 'https://git.internal.example/acme/widgets.git'],
	])
	const hosts = await collectHosts(dir, [], false)
	const byHost = Object.fromEntries(hosts.map((h) => [h.hostname, h]))
	assert.equal(byHost['github.com']?.kind, 'github')
	assert.equal(byHost['github.com']?.selfHosted, false)
	assert.deepEqual(byHost['github.com']?.remotes, ['origin'])
	assert.equal(byHost['gitlab.com']?.kind, 'gitlab')
	assert.equal(byHost['git.internal.example']?.kind, null)
	assert.equal(byHost['git.internal.example']?.selfHosted, true)
})

test('collectHosts: --host requested specs, with and without explicit hostname', async () => {
	const hosts = await collectHosts('.', ['github', 'gitea=git.example.com'], false)
	assert.deepEqual(
		hosts.map((h) => [h.hostname, h.kind]),
		[
			['github.com', 'github'],
			['git.example.com', 'gitea'],
		],
	)
})

test('collectHosts: invalid --host kind exits with usage error', async () => {
	await expect(collectHosts('.', ['not-a-kind'], false)).rejects.toThrow('exit:2')
	expect(stderrSpy.mock.calls.join('')).toMatch(/--host must be one of/)
})

test('collectHosts: probes a self-hosted host and reclassifies it', async () => {
	const dir = gitRepo([['origin', 'https://git.example.com/acme/widgets.git']])
	const originalFetch = global.fetch
	global.fetch = (async (url: string | URL | Request) => {
		if (String(url).includes('/api/v1/version')) {
			return { status: 200, text: async () => '{"version":"1.20.0"}' } as Response
		}
		return { status: 404, text: async () => '' } as Response
	}) as typeof fetch
	try {
		const hosts = await collectHosts(dir, [], true)
		assert.equal(hosts[0]?.kind, 'gitea')
		assert.equal(hosts[0]?.probed, true)
	} finally {
		global.fetch = originalFetch
	}
})

test('collectHosts: probe finds forgejo, gitlab and github signatures, and none at all', async () => {
	const originalFetch = global.fetch
	global.fetch = (async (url: string | URL | Request) => {
		const u = String(url)
		if (u.includes('fj.example.com') && u.includes('/api/v1/version')) {
			return { status: 200, text: async () => '{"version":"1.0+forgejo-1.20"}' } as Response
		}
		if (u.includes('gl.example.com') && u.includes('/api/v4/version')) {
			return { status: 401, text: async () => 'Unauthorized' } as Response
		}
		if (u.includes('gh.example.com') && u.includes('/api/v3/meta')) {
			return { status: 200, text: async () => '{"installed_version":"3.1"}' } as Response
		}
		return { status: 404, text: async () => '' } as Response
	}) as typeof fetch
	try {
		const fj = gitRepo([['origin', 'https://fj.example.com/a/b.git']])
		assert.equal((await collectHosts(fj, [], true))[0]?.kind, 'forgejo')
		const gl = gitRepo([['origin', 'https://gl.example.com/a/b.git']])
		assert.equal((await collectHosts(gl, [], true))[0]?.kind, 'gitlab')
		const gh = gitRepo([['origin', 'https://gh.example.com/a/b.git']])
		assert.equal((await collectHosts(gh, [], true))[0]?.kind, 'github')
		const none = gitRepo([['origin', 'https://unknown.example.com/a/b.git']])
		const hosts = await collectHosts(none, [], true)
		assert.equal(hosts[0]?.kind, null)
		assert.equal(hosts[0]?.probed, undefined)
	} finally {
		global.fetch = originalFetch
	}
})

test('collectHosts: probe network failure is swallowed', async () => {
	const originalFetch = global.fetch
	global.fetch = (async () => {
		throw new Error('network down')
	}) as unknown as typeof fetch
	try {
		const dir = gitRepo([['origin', 'https://git.example.com/a/b.git']])
		const hosts = await collectHosts(dir, [], true)
		assert.equal(hosts[0]?.kind, null)
	} finally {
		global.fetch = originalFetch
	}
})
