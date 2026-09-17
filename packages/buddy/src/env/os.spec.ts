import assert from 'node:assert/strict'
import { test } from '@jest/globals'
import { distroFamily, parseOsRelease } from './os.js'

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
