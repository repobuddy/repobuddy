import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from '@jest/globals'
import type { HostEntry } from './clis.js'
import { CLIS, describeCli, installOptions } from './clis.js'
import type { OsInfo } from './os.js'

test('installOptions filters by OS family, available managers, and version', () => {
	const managers = (o: { cli: keyof typeof CLIS; os: OsInfo }, m: string[]) =>
		installOptions(CLIS[o.cli], o.os, m).map((r) => r.manager ?? 'download')
	const ubuntu = (v: string): OsInfo =>
		({
			platform: 'linux',
			arch: 'x64',
			release: '',
			wsl: false,
			family: 'debian',
			distro: { id: 'ubuntu', idLike: null, version: v, name: null },
		}) as OsInfo
	assert.deepEqual(managers({ cli: 'github', os: ubuntu('24.04') }, ['apt-get', 'snap']), ['apt-get'])
	assert.deepEqual(managers({ cli: 'gitlab', os: ubuntu('24.04') }, ['apt-get', 'snap']), ['snap', 'download'])
	assert.deepEqual(managers({ cli: 'forgejo', os: ubuntu('24.04') }, ['apt-get']), ['download'])
	assert.deepEqual(managers({ cli: 'forgejo', os: ubuntu('25.10') }, ['apt-get']), ['apt-get', 'download'])
	const mac: OsInfo = { platform: 'darwin', arch: 'x64', release: '', wsl: false, family: 'macos' }
	assert.deepEqual(managers({ cli: 'github', os: mac }, ['brew', 'apt-get']), ['brew'])
	const win: OsInfo = { platform: 'win32', arch: 'x64', release: '', wsl: false, family: 'windows' }
	assert.deepEqual(managers({ cli: 'azure', os: win }, ['winget', 'choco']), ['winget'])
	const arch: OsInfo = {
		platform: 'linux',
		arch: 'x64',
		release: '',
		wsl: false,
		family: 'arch',
		distro: { id: 'arch', idLike: null, version: null, name: null },
	}
	assert.deepEqual(managers({ cli: 'gitlab', os: arch }, ['pacman']), ['pacman'])
	const other: OsInfo = {
		platform: 'linux',
		arch: 'x64',
		release: '',
		wsl: false,
		family: 'other',
		distro: { id: 'void', idLike: null, version: null, name: null },
	}
	assert.deepEqual(managers({ cli: 'github', os: other }, ['xbps-install']), [])
	assert.deepEqual(managers({ cli: 'github', os: other }, ['brew']), ['brew'])
	// forgejo's apt-get recipe `when()` else branch: debian (not ubuntu) with and without a version.
	const debianUnstable: OsInfo = {
		...ubuntu('24.04'),
		distro: { id: 'debian', idLike: null, version: null, name: null },
	}
	assert.deepEqual(managers({ cli: 'forgejo', os: debianUnstable }, ['apt-get']), ['apt-get', 'download'])
	const debianStable: OsInfo = { ...ubuntu('24.04'), distro: { id: 'debian', idLike: null, version: '12', name: null } }
	assert.deepEqual(managers({ cli: 'forgejo', os: debianStable }, ['apt-get']), ['download'])
	// ubuntu with no version at all falls back to '0' before comparing.
	const ubuntuNoVersion: OsInfo = {
		...ubuntu('24.04'),
		distro: { id: 'ubuntu', idLike: null, version: null, name: null },
	}
	assert.deepEqual(managers({ cli: 'forgejo', os: ubuntuNoVersion }, ['apt-get']), ['download'])
})

const linuxOs: OsInfo = { platform: 'linux', arch: 'x64', release: '', wsl: false, family: 'debian' }

function fakeCli(): { dir: string; env: NodeJS.ProcessEnv } {
	const dir = mkdtempSync(join(tmpdir(), 'cli-'))
	return { dir, env: { PATH: dir } }
}

function writeScript(dir: string, name: string, body: string): void {
	const file = join(dir, name)
	writeFileSync(file, `#!/bin/sh\n${body}\n`)
	chmodSync(file, 0o755)
}

test('describeCli: no host kind, or a CLI-less host (bitbucket)', () => {
	assert.equal(describeCli({ hostname: null, kind: null, remotes: [], selfHosted: false }, linuxOs, [], {}), null)
	const bb = describeCli(
		{ hostname: 'bitbucket.org', kind: 'bitbucket', remotes: [], selfHosted: false },
		linuxOs,
		[],
		{},
	)
	assert.deepEqual(bb, { name: null, install: [], note: CLIS['bitbucket'].note })
})

test('describeCli: gh not installed lists install options', () => {
	const host: HostEntry = { hostname: 'github.com', kind: 'github', remotes: [], selfHosted: false }
	const result = describeCli(host, linuxOs, ['apt-get'], {})
	assert.equal(result?.installed, false)
	assert.ok(result?.install.some((i) => i.manager === 'apt-get'))
	assert.equal(result?.docs, CLIS['github'].docs)
})

test('describeCli: gh installed and authenticated, token env reported', () => {
	const { dir, env } = fakeCli()
	writeScript(dir, 'gh', 'if [ "$1" = "--version" ]; then echo "gh version 2.4.0"; else exit 0; fi')
	const host: HostEntry = { hostname: 'github.com', kind: 'github', remotes: [], selfHosted: false }
	const result = describeCli(host, linuxOs, [], { ...env, GH_TOKEN: 'x' })
	assert.equal(result?.installed, true)
	assert.equal(result?.version, 'gh version 2.4.0')
	assert.equal(result?.authenticated, true)
	assert.deepEqual(result?.tokenEnv, ['GH_TOKEN is set'])
	assert.equal(result?.install.length, 0)
})

test('describeCli: self-hosted github/gitlab pass --hostname to auth and login', () => {
	const { dir, env } = fakeCli()
	writeScript(dir, 'gh', 'exit 0')
	const ghHost: HostEntry = { hostname: 'ghe.example.com', kind: 'github', remotes: [], selfHosted: true }
	const ghResult = describeCli(ghHost, linuxOs, [], env)
	assert.equal(ghResult?.login, 'gh auth login --hostname ghe.example.com')

	const { dir: dir2, env: env2 } = fakeCli()
	writeScript(dir2, 'glab', 'exit 0')
	const glHost: HostEntry = { hostname: 'gl.example.com', kind: 'gitlab', remotes: [], selfHosted: true }
	const glResult = describeCli(glHost, linuxOs, [], env2)
	assert.equal(glResult?.login, 'glab auth login --hostname gl.example.com')
})

test('describeCli: a CLI found on PATH but not executable reports auth unknown (status null)', () => {
	const { dir, env } = fakeCli()
	writeFileSync(join(dir, 'gh'), '#!/bin/sh\nexit 0\n') // no chmod +x
	const host: HostEntry = { hostname: 'github.com', kind: 'github', remotes: [], selfHosted: false }
	const result = describeCli(host, linuxOs, [], env)
	assert.equal(result?.authenticated, null)
})

test('describeCli: glab reports logged-out even on exit 0 (loggedOut regex)', () => {
	const { dir, env } = fakeCli()
	writeScript(dir, 'glab', 'echo "not logged in"; exit 0')
	const host: HostEntry = { hostname: 'gitlab.com', kind: 'gitlab', remotes: [], selfHosted: false }
	const result = describeCli(host, linuxOs, [], env)
	assert.equal(result?.authenticated, false)
})

test('describeCli: tea auth is unreliable, treated as unknown', () => {
	const { dir, env } = fakeCli()
	writeScript(dir, 'tea', 'exit 1')
	const host: HostEntry = { hostname: 'gitea.example.com', kind: 'gitea', remotes: [], selfHosted: true }
	const result = describeCli(host, linuxOs, [], env)
	assert.equal(result?.authenticated, null)
	assert.equal(result?.login, 'tea login add --url https://gitea.example.com --token <token>')
})

test('describeCli: tea login falls back to <instance> when there is no hostname', () => {
	const { dir, env } = fakeCli()
	writeScript(dir, 'tea', 'exit 0')
	const host: HostEntry = { hostname: null, kind: 'gitea', remotes: [], selfHosted: false }
	const result = describeCli(host, linuxOs, [], env)
	assert.equal(result?.login, 'tea login add --url https://<instance> --token <token>')
})

test('describeCli: selfHosted with no hostname falls back to undefined for auth/login args', () => {
	const { dir, env } = fakeCli()
	writeScript(dir, 'gh', 'exit 0')
	const host: HostEntry = { hostname: null, kind: 'github', remotes: [], selfHosted: true }
	const result = describeCli(host, linuxOs, [], env)
	assert.equal(result?.login, 'gh auth login')
})

test('describeCli: forgejo self-hosted uses --host in auth and login', () => {
	const { dir, env } = fakeCli()
	writeScript(dir, 'fj', 'exit 0')
	const host: HostEntry = { hostname: 'fj.example.com', kind: 'forgejo', remotes: [], selfHosted: true }
	const result = describeCli(host, linuxOs, [], env)
	assert.equal(result?.login, 'fj --host fj.example.com auth login')
	assert.equal(result?.authenticated, true)
})

test('describeCli: forgejo public (not self-hosted) auth/login omit --host', () => {
	const { dir, env } = fakeCli()
	writeScript(dir, 'fj', 'exit 0')
	const host: HostEntry = { hostname: 'codeberg.org', kind: 'forgejo', remotes: [], selfHosted: false }
	const result = describeCli(host, linuxOs, [], env)
	assert.equal(result?.login, 'fj auth login')
})

test('describeCli: self-hosted azure with no auth login string uses default login()', () => {
	const { dir, env } = fakeCli()
	writeScript(dir, 'az', 'exit 0')
	const host: HostEntry = { hostname: 'azure.example.com', kind: 'azure', remotes: [], selfHosted: true }
	const result = describeCli(host, linuxOs, [], env)
	assert.equal(result?.login, 'az login')
	assert.deepEqual(result?.postInstall, ['az extension add --name azure-devops'])
})
