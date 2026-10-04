import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from '@jest/globals'
import { readInjectionSurface } from './injection-surface.js'

const dirs: string[] = []

function repo(files: Record<string, unknown>) {
	const dir = mkdtempSync(join(tmpdir(), 'agent-readiness-'))
	dirs.push(dir)
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(dirname(join(dir, path)), { recursive: true })
		writeFileSync(join(dir, path), typeof content === 'string' ? content : JSON.stringify(content))
	}
	return dir
}

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('readInjectionSurface', () => {
	it('finds nothing in a repo without hook or MCP config', () => {
		expect(readInjectionSurface(repo({ 'README.md': '# x' }))).toEqual({ hooks: [], mcpServers: [] })
	})

	it('lists session-start and per-prompt hooks from Claude Code and Gemini CLI settings', () => {
		const dir = repo({
			'.claude/settings.json': {
				hooks: {
					SessionStart: [{ hooks: [{ type: 'command', command: 'cat AGENTS.md' }] }],
					UserPromptSubmit: [{ matcher: '', hooks: [{ type: 'command', command: 'gh issue list' }] }],
					PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'guard.sh' }] }],
				},
			},
			'.gemini/settings.json': { hooks: { BeforeAgent: [{ hooks: [{ type: 'command', command: 'fetch.sh' }] }] } },
		})
		expect(readInjectionSurface(dir).hooks).toEqual([
			{ file: '.claude/settings.json', event: 'SessionStart', command: 'cat AGENTS.md' },
			{ file: '.claude/settings.json', event: 'UserPromptSubmit', command: 'gh issue list' },
			{ file: '.gemini/settings.json', event: 'BeforeAgent', command: 'fetch.sh' },
		])
	})

	it('lists hooks from Cursor and Copilot hook files', () => {
		const dir = repo({
			'.cursor/hooks.json': { version: 1, hooks: { sessionStart: [{ command: 'ctx.sh' }], stop: [{ command: 'x' }] } },
			'.github/hooks/context.json': { version: 1, hooks: { sessionStart: [{ type: 'command', bash: 'ctx.sh' }] } },
			'.github/hooks/notes.md': 'not a hook file',
		})
		expect(readInjectionSurface(dir).hooks).toEqual([
			{ file: '.cursor/hooks.json', event: 'sessionStart', command: 'ctx.sh' },
			{ file: '.github/hooks/context.json', event: 'sessionStart', command: 'ctx.sh' },
		])
	})

	it('lists MCP servers with their command or URL, including VS Code `servers`', () => {
		const dir = repo({
			'.mcp.json': { mcpServers: { fetch: { command: 'npx', args: ['-y', 'fetch-mcp'] } } },
			'.cursor/mcp.json': '{',
			'.vscode/mcp.json': { servers: { github: { type: 'http', url: 'https://api.githubcopilot.com/mcp/' } } },
		})
		expect(readInjectionSurface(dir).mcpServers).toEqual([
			{ file: '.mcp.json', name: 'fetch', target: 'npx -y fetch-mcp' },
			{ file: '.vscode/mcp.json', name: 'github', target: 'https://api.githubcopilot.com/mcp/' },
		])
	})

	it('skips malformed entries and falls back to the PowerShell command', () => {
		const dir = repo({
			'.claude/settings.json': {
				hooks: { SessionStart: ['x', { hooks: 'x' }, { hooks: [{ type: 'prompt' }] }], UserPromptSubmit: 'x' },
			},
			'.github/hooks/ps.json': { hooks: { sessionStart: [{ powershell: 'ctx.ps1' }] } },
			'.mcp.json': { mcpServers: { bad: 'x', bare: {}, local: { command: 'srv', args: ['--a', 1] } } },
			'.cursor/mcp.json': { mcpServers: [] },
		})
		expect(readInjectionSurface(dir)).toEqual({
			hooks: [{ file: '.github/hooks/ps.json', event: 'sessionStart', command: 'ctx.ps1' }],
			mcpServers: [
				{ file: '.mcp.json', name: 'bare', target: '' },
				{ file: '.mcp.json', name: 'local', target: 'srv --a' },
			],
		})
	})
})
