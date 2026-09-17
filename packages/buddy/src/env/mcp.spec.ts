import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from '@jest/globals'
import { collectMcp, describeServer, matchKinds, parseJsonc } from './mcp.js'

function tmp(prefix: string): string {
	return mkdtempSync(join(tmpdir(), prefix))
}

function write(dir: string, rel: string, content: string): void {
	const file = join(dir, rel)
	mkdirSync(join(file, '..'), { recursive: true })
	writeFileSync(file, content)
}

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

test('collectMcp: claude-code user config with a project-local block, and project .mcp.json', () => {
	const home = tmp('mcp-home-')
	const dir = tmp('mcp-proj-')
	write(
		home,
		'.claude.json',
		JSON.stringify({
			mcpServers: { userGh: { url: 'https://api.githubcopilot.com/mcp/' } },
			projects: { [dir]: { mcpServers: { localGh: { command: 'npx', args: ['github-mcp-server'] } } } },
		}),
	)
	write(dir, '.mcp.json', JSON.stringify({ mcpServers: { projGh: { url: 'https://api.githubcopilot.com/mcp/' } } }))
	const found = collectMcp(dir, {}, ['github'], home)
	const names = found.map((f) => ('name' in f ? f.name : f.file))
	assert.ok(names.includes('userGh'))
	assert.ok(names.includes('projGh'))
	const local = found.find((f) => 'name' in f && f.name === 'localGh')
	assert.ok(local && 'scope' in local && local.scope === 'local')
})

test('collectMcp: cursor, gemini, windsurf, opencode, zed json sources', () => {
	const home = tmp('mcp-home-')
	const dir = tmp('mcp-proj-')
	write(
		home,
		join('.cursor', 'mcp.json'),
		JSON.stringify({ mcpServers: { a: { url: 'https://gitlab.com/api/v4/mcp' } } }),
	)
	write(
		dir,
		join('.cursor', 'mcp.json'),
		JSON.stringify({ mcpServers: { b: { url: 'https://gitlab.com/api/v4/mcp' } } }),
	)
	write(
		home,
		join('.gemini', 'settings.json'),
		JSON.stringify({ mcpServers: { c: { url: 'https://gitlab.com/api/v4/mcp' } } }),
	)
	write(
		home,
		join('.codeium', 'windsurf', 'mcp_config.json'),
		JSON.stringify({ mcpServers: { d: { url: 'https://gitlab.com/api/v4/mcp' } } }),
	)
	write(dir, 'opencode.json', JSON.stringify({ mcp: { e: { url: 'https://gitlab.com/api/v4/mcp' } } }))
	write(
		dir,
		join('.zed', 'settings.json'),
		JSON.stringify({ context_servers: { f: { url: 'https://gitlab.com/api/v4/mcp' } } }),
	)
	const found = collectMcp(dir, {}, ['gitlab'], home)
	const names = found.filter((f): f is Extract<typeof f, { name: string }> => 'name' in f).map((f) => f.name)
	assert.deepEqual(new Set(names), new Set(['a', 'b', 'c', 'd', 'e', 'f']))
})

test('collectMcp: vscode user config on linux uses XDG_CONFIG_HOME, and copilot-cli via env override', () => {
	const home = tmp('mcp-home-')
	const dir = tmp('mcp-proj-')
	const xdg = tmp('mcp-xdg-')
	write(
		xdg,
		join('Code', 'User', 'mcp.json'),
		JSON.stringify({ servers: { vs: { url: 'https://gitlab.com/api/v4/mcp' } } }),
	)
	const copilotHome = tmp('mcp-copilot-')
	write(
		copilotHome,
		'mcp-config.json',
		JSON.stringify({ mcpServers: { cp: { url: 'https://gitlab.com/api/v4/mcp' } } }),
	)
	const found = collectMcp(dir, { XDG_CONFIG_HOME: xdg, COPILOT_HOME: copilotHome }, ['gitlab'], home)
	const names = found.filter((f): f is Extract<typeof f, { name: string }> => 'name' in f).map((f) => f.name)
	assert.ok(names.includes('vs'))
	assert.ok(names.includes('cp'))
})

test('collectMcp: codex toml source (user and project) with disabled entry', () => {
	const home = tmp('mcp-home-')
	const dir = tmp('mcp-proj-')
	write(
		home,
		join('.codex', 'config.toml'),
		'[mcp_servers.gh]\ncommand = "npx"\nargs = ["-y", "github-mcp-server"]\nenabled = false\n\n[mcp_servers.gh.env]\nTOKEN = "x"\n',
	)
	write(dir, join('.codex', 'config.toml'), '[mcp_servers.gh2]\nurl = "https://api.githubcopilot.com/mcp/"\n')
	const found = collectMcp(dir, {}, ['github'], home)
	const gh = found.find((f) => 'name' in f && f.name === 'gh') as { disabled: boolean } | undefined
	assert.equal(gh?.disabled, true)
	assert.ok(found.some((f) => 'name' in f && f.name === 'gh2'))
})

test('collectMcp: unreadable/invalid JSON file surfaces as an error entry', () => {
	const home = tmp('mcp-home-')
	const dir = tmp('mcp-proj-')
	write(dir, '.mcp.json', '{not json')
	const found = collectMcp(dir, {}, ['github'], home)
	const err = found.find((f) => 'error' in f) as { error: string } | undefined
	assert.ok(err?.error.startsWith('unreadable:'))
})

test('collectMcp: plugin .mcp.json is flat, scoped to project, and gated by enabledPlugins', () => {
	const home = tmp('mcp-home-')
	const dir = tmp('mcp-proj-')
	const installDir = tmp('mcp-install-')
	write(
		home,
		join('.claude', 'plugins', 'installed_plugins.json'),
		JSON.stringify({ plugins: { 'acme-plugin': [{ projectPath: dir, installPath: installDir }] } }),
	)
	write(installDir, '.mcp.json', JSON.stringify({ gh: { url: 'https://api.githubcopilot.com/mcp/' } }))
	// disabled: no enabledPlugins entry anywhere
	let found = collectMcp(dir, {}, ['github'], home)
	let gh = found.find((f) => 'name' in f && f.name === 'gh') as { disabled: boolean } | undefined
	assert.equal(gh?.disabled, true)

	write(home, join('.claude', 'settings.json'), JSON.stringify({ enabledPlugins: { 'acme-plugin': true } }))
	found = collectMcp(dir, {}, ['github'], home)
	gh = found.find((f) => 'name' in f && f.name === 'gh') as { disabled: boolean } | undefined
	assert.equal(gh?.disabled, false)
})

test('collectMcp: plugin sources with no installed_plugins.json produce nothing extra', () => {
	const home = tmp('mcp-home-')
	const dir = tmp('mcp-proj-')
	const found = collectMcp(dir, {}, ['github'], home)
	assert.deepEqual(found, [])
})

test('collectMcp: plugin entry for a different project is skipped', () => {
	const home = tmp('mcp-home-')
	const dir = tmp('mcp-proj-')
	const otherDir = tmp('mcp-other-')
	const installDir = tmp('mcp-install-')
	write(
		home,
		join('.claude', 'plugins', 'installed_plugins.json'),
		JSON.stringify({ plugins: { 'acme-plugin': [{ projectPath: otherDir, installPath: installDir }] } }),
	)
	write(installDir, '.mcp.json', JSON.stringify({ gh: { url: 'https://api.githubcopilot.com/mcp/' } }))
	const found = collectMcp(dir, {}, ['github'], home)
	assert.deepEqual(found, [])
})
