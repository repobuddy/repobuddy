import assert from 'node:assert/strict'
import { test } from '@jest/globals'
import { describeServer, matchKinds, parseJsonc } from './mcp.js'

test('parseJsonc keeps strings intact', () => {
	const text = `{
			// comment
			"servers": { "a": { "url": "https://x/y//z", "note": "/* not a comment */", }, },
			/* block */
		}`
	assert.deepEqual(parseJsonc(text), { servers: { a: { url: 'https://x/y//z', note: '/* not a comment */' } } })
})

test('describeServer never returns secrets', () => {
	const entry = {
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
	}
	const s = describeServer('gh', entry)
	const out = JSON.stringify(s)
	assert.ok(!out.includes('ghp_real') && !out.includes('abc') && !out.includes('Bearer') && !out.includes('ghp_secret'))
	assert.equal(s.command, 'docker')
	assert.ok(s.args.includes('ghcr.io/github/github-mcp-server'))
	const entry2 = { url: 'https://gitlab.com/api/v4/mcp?private_token=zzz', headers: { a: 'b' } }
	const r = describeServer('x', entry2)
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
