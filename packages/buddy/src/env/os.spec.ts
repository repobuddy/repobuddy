import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from '@jest/globals'
import { detectOs, distroFamily, parseOsRelease, run, which } from './os.js'

test('distroFamily', () => {
	const cases: [string, string, string][] = [
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

test('run: success and a missing binary', () => {
	const ok = run(process.execPath, ['--version'])
	assert.equal(ok.status, 0)
	assert.match(ok.stdout, /^v\d/)
	const missing = run('this-binary-does-not-exist-xyz', [])
	assert.equal(missing.status, null)
})

test('which: finds an executable on PATH, misses otherwise, and honors PATHEXT on win32', () => {
	const dir = mkdtempSync(join(tmpdir(), 'which-'))
	const bin = join(dir, 'mytool')
	writeFileSync(bin, '#!/bin/sh\n')
	chmodSync(bin, 0o755)
	const env = { PATH: dir }
	assert.equal(which('mytool', env), bin)
	assert.equal(which('nope', env), null)
	assert.equal(which('mytool', {}), null)

	const winDir = mkdtempSync(join(tmpdir(), 'which-win-'))
	writeFileSync(join(winDir, 'mytool.EXE'), 'x')
	assert.equal(which('mytool', { PATH: winDir, PATHEXT: '.EXE;.CMD' }, 'win32'), join(winDir, 'mytool.EXE'))
	assert.equal(which('mytool', { Path: winDir, PATHEXT: '.EXE' }, 'win32'), join(winDir, 'mytool.EXE'))
})

test('detectOs: macos', () => {
	const os = detectOs(
		{},
		{
			platform: () => 'darwin',
			arch: () => 'arm64',
			release: () => '23.0.0',
			run: () => ({ status: 0, stdout: '14.5', stderr: '' }),
		},
	)
	assert.equal(os.family, 'macos')
	assert.equal(os.version, '14.5')
	assert.equal(os.arch, 'arm64')
})

test('detectOs: macos with empty sw_vers output falls back to null version', () => {
	const os = detectOs({}, { platform: () => 'darwin', run: () => ({ status: 0, stdout: '', stderr: '' }) })
	assert.equal(os.version, null)
})

test('detectOs: windows has no distro/sudo', () => {
	const os = detectOs({}, { platform: () => 'win32' })
	assert.equal(os.family, 'windows')
	assert.equal(os.sudo, undefined)
})

test('detectOs: linux WSL detected via env var, root sudo', () => {
	const os = detectOs(
		{ WSL_DISTRO_NAME: 'Ubuntu' },
		{
			platform: () => 'linux',
			readText: (f) => (f === '/etc/os-release' ? 'ID=ubuntu\nID_LIKE=debian\n' : ''),
			getuid: () => 0,
		},
	)
	assert.equal(os.wsl, true)
	assert.equal(os.family, 'debian')
	assert.equal(os.sudo, 'root')
})

test('detectOs: linux WSL detected via /proc/version, sudo absent', () => {
	const os = detectOs(
		{},
		{
			platform: () => 'linux',
			readText: (f) => (f === '/proc/version' ? 'Linux version 5.0 Microsoft' : ''),
			getuid: () => 1000,
			which: () => null,
		},
	)
	assert.equal(os.wsl, true)
	assert.deepEqual(os.distro, { id: null, idLike: null, version: null, name: null })
	assert.equal(os.sudo, 'absent')
})

test('detectOs: linux sudo passwordless vs needs-password', () => {
	const passwordless = detectOs(
		{},
		{
			platform: () => 'linux',
			readText: () => '',
			getuid: () => 1000,
			which: () => '/usr/bin/sudo',
			run: () => ({ status: 0, stdout: '', stderr: '' }),
		},
	)
	assert.equal(passwordless.sudo, 'passwordless')
	const needsPassword = detectOs(
		{},
		{
			platform: () => 'linux',
			readText: () => '',
			getuid: () => 1000,
			which: () => '/usr/bin/sudo',
			run: () => ({ status: 1, stdout: '', stderr: '' }),
		},
	)
	assert.equal(needsPassword.sudo, 'needs-password')
})

test('detectOs: other platform (e.g. freebsd)', () => {
	const os = detectOs({}, { platform: () => 'freebsd' as NodeJS.Platform, getuid: () => 1000, which: () => null })
	assert.equal(os.family, 'other')
	assert.equal(os.distro, undefined)
})

test('detectOs: no getuid available (Windows-style process without it)', () => {
	const os = detectOs({}, { platform: () => 'linux', readText: () => '', which: () => null })
	assert.equal(os.sudo, 'absent')
})
