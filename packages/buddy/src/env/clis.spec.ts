import assert from 'node:assert/strict'
import { test } from '@jest/globals'
import { CLIS, installOptions } from './clis.js'
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
})
