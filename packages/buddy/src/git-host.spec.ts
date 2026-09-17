import assert from 'node:assert/strict'
import { test } from '@jest/globals'
import { hostKind, remoteHost } from './git-host.js'

test('remote hosts', () => {
	assert.equal(remoteHost('git@github.com:a/b.git'), 'github.com')
	assert.equal(remoteHost('ssh://git@gitlab.corp:2222/a/b'), 'gitlab.corp')
	assert.equal(remoteHost('https://user@dev.azure.com/o/p/_git/r'), 'dev.azure.com')
	assert.equal(hostKind('ghe.corp.github.com'), 'github')
	assert.equal(hostKind('github.acme.com'), 'github')
	assert.equal(hostKind('git.acme.com'), null)
	assert.equal(hostKind('ssh.dev.azure.com'), 'azure')
})
