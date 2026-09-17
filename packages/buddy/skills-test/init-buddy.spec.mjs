import assert from 'node:assert/strict'
import { test } from '@jest/globals'
import {
	CLIS,
	describeServer,
	distroFamily,
	hostKind,
	installOptions,
	matchKinds,
	parseJsonc,
	parseOsRelease,
	remoteHost,
} from '../skills/init-buddy/scripts/detect-env.mjs'

test('distroFamily', () => {
	const cases = [
		['ubuntu', 'debian', 'debian'],
		['pop', 'ubuntu debian', 'debian'],
		['linuxmint', 'ubuntu', 'debian'],
		['fedora', '', 'fedora'],
		['rocky', 'rhel centos fedora', 'rhel'],
		['almalinux', 'rhel centos fedora', 'rhel'],
		['amzn', 'centos rhel fedora', 'rhel'],
		['arch', '', 'arch'],
		['manjaro', 'arch', 'arch'],
		['endeavouros', 'arch', 'arch'],
		['opensuse-tumbleweed', 'opensuse suse', 'suse'],
		['sles', '', 'suse'],
		['alpine', '', 'alpine'],
		['nixos', '', 'nixos'],
		['void', '', 'other'],
		['gentoo', '', 'other'],
	]
	for (const [id, like, want] of cases) assert.equal(distroFamily(id, like), want, `${id} / ${like}`)
})

test('parseOsRelease', () => {
	assert.deepEqual(parseOsRelease('ID=ubuntu\nID_LIKE=debian\nPRETTY_NAME="Ubuntu 24.04"\nVERSION_ID=\'24.04\'\n'), {
		ID: 'ubuntu',
		ID_LIKE: 'debian',
		PRETTY_NAME: 'Ubuntu 24.04',
		VERSION_ID: '24.04',
	})
})

test('remote hosts', () => {
	assert.equal(remoteHost('git@github.com:a/b.git'), 'github.com')
	assert.equal(remoteHost('ssh://git@gitlab.corp:2222/a/b'), 'gitlab.corp')
	assert.equal(remoteHost('https://user@dev.azure.com/o/p/_git/r'), 'dev.azure.com')
	assert.equal(hostKind('ghe.corp.github.com'), 'github')
	assert.equal(hostKind('github.acme.com'), 'github')
	assert.equal(hostKind('git.acme.com'), null)
	assert.equal(hostKind('ssh.dev.azure.com'), 'azure')
})

test('parseJsonc keeps strings intact', () => {
	const text = `{
		// comment
		"servers": { "a": { "url": "https://x/y//z", "note": "/* not a comment */", }, },
		/* block */
	}`
	assert.deepEqual(parseJsonc(text), { servers: { a: { url: 'https://x/y//z', note: '/* not a comment */' } } })
})

test('describeServer never returns secrets', () => {
	const s = describeServer('gh', {
		command: '/usr/local/bin/docker',
		args: [
			'run',
			'-i',
			'--rm',
			'-e',
			'GITHUB_PERSONAL_ACCESS_TOKEN',
			'ghcr.io/github/github-mcp-server',
			'--token=abc',
			'ghp_secret_token',
		],
		env: { GITHUB_PERSONAL_ACCESS_TOKEN: 'ghp_real' },
		headers: { Authorization: 'Bearer x' },
	})
	const out = JSON.stringify(s)
	assert.ok(!out.includes('ghp_real') && !out.includes('abc') && !out.includes('Bearer') && !out.includes('ghp_secret'))
	assert.equal(s.command, 'docker')
	assert.ok(s.args.includes('ghcr.io/github/github-mcp-server'))
	const r = describeServer('x', { url: 'https://gitlab.com/api/v4/mcp?private_token=zzz', headers: { a: 'b' } })
	assert.equal(r.url, 'https://gitlab.com/api/v4/mcp')
	assert.equal(r.transport, 'remote')
})

test('matchKinds', () => {
	assert.deepEqual(matchKinds(describeServer('work', { url: 'https://api.githubcopilot.com/mcp/' })), ['github'])
	assert.deepEqual(matchKinds(describeServer('atl', { url: 'https://mcp.atlassian.com/v1/sse' })), ['bitbucket'])
	assert.deepEqual(matchKinds(describeServer('ado', { command: 'npx', args: ['-y', '@azure-devops/mcp', 'myorg'] })), [
		'azure',
	])
	assert.deepEqual(matchKinds(describeServer('mail', { url: 'http://localhost:8765/mcp' })), [])
})

test('installOptions filters by OS family, available managers, and version', () => {
	const managers = (o, m) => installOptions(CLIS[o.cli], o.os, m).map((r) => r.manager ?? 'download')
	const ubuntu = (v) => ({ platform: 'linux', family: 'debian', distro: { id: 'ubuntu', version: v } })
	assert.deepEqual(managers({ cli: 'github', os: ubuntu('24.04') }, ['apt-get', 'snap']), ['apt-get'])
	assert.deepEqual(managers({ cli: 'gitlab', os: ubuntu('24.04') }, ['apt-get', 'snap']), ['snap', 'download'])
	assert.deepEqual(managers({ cli: 'forgejo', os: ubuntu('24.04') }, ['apt-get']), ['download'])
	assert.deepEqual(managers({ cli: 'forgejo', os: ubuntu('25.10') }, ['apt-get']), ['apt-get', 'download'])
	const mac = { platform: 'darwin', family: 'macos' }
	assert.deepEqual(managers({ cli: 'github', os: mac }, ['brew', 'apt-get']), ['brew'])
	const win = { platform: 'win32', family: 'windows' }
	assert.deepEqual(managers({ cli: 'azure', os: win }, ['winget', 'choco']), ['winget'])
	const arch = { platform: 'linux', family: 'arch', distro: { id: 'arch' } }
	assert.deepEqual(managers({ cli: 'gitlab', os: arch }, ['pacman']), ['pacman'])
	const other = { platform: 'linux', family: 'other', distro: { id: 'void' } }
	assert.deepEqual(managers({ cli: 'github', os: other }, ['xbps-install']), [])
	assert.deepEqual(managers({ cli: 'github', os: other }, ['brew']), ['brew'])
})
