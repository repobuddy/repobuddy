import { existsSync, readFileSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { basename, join, resolve } from 'node:path'
import type { HostKind } from '../git-host.js'

/** Distinctive substrings of MCP server configs, per host kind. Matched against name, command, args, and URL. */
const MCP_SIGNATURES: Record<HostKind, RegExp[]> = {
	github: [/github/i, /githubcopilot\.com\/mcp/i],
	gitlab: [/gitlab/i, /\/api\/v4\/mcp/i],
	bitbucket: [/bitbucket/i, /mcp\.atlassian\.com/i, /atlassian-mcp/i],
	azure: [/azure-devops/i, /dev\.azure\.com/i, /\bado\b/i],
	gitea: [/gitea/i],
	forgejo: [/forgejo/i, /codeberg/i],
}

function vscodeUserDir(env: NodeJS.ProcessEnv): string {
	const home = homedir()
	if (platform() === 'win32') return join(env['APPDATA'] ?? join(home, 'AppData', 'Roaming'), 'Code', 'User')
	if (platform() === 'darwin') return join(home, 'Library', 'Application Support', 'Code', 'User')
	return join(env['XDG_CONFIG_HOME'] ?? join(home, '.config'), 'Code', 'User')
}

interface McpSource {
	harness: string
	scope: string
	file: string
	key?: string
	toml?: boolean
	project?: string
}

function mcpSources(dir: string, env: NodeJS.ProcessEnv): McpSource[] {
	const home = homedir()
	const xdg = env['XDG_CONFIG_HOME'] ?? join(home, '.config')
	return [
		{ harness: 'claude-code', scope: 'user', file: join(home, '.claude.json'), key: 'mcpServers', project: dir },
		{ harness: 'claude-code', scope: 'project', file: join(dir, '.mcp.json'), key: 'mcpServers' },
		{ harness: 'cursor', scope: 'user', file: join(home, '.cursor', 'mcp.json'), key: 'mcpServers' },
		{ harness: 'cursor', scope: 'project', file: join(dir, '.cursor', 'mcp.json'), key: 'mcpServers' },
		{
			harness: 'codex',
			scope: 'user',
			file: join(env['CODEX_HOME'] ?? join(home, '.codex'), 'config.toml'),
			toml: true,
		},
		{ harness: 'codex', scope: 'project', file: join(dir, '.codex', 'config.toml'), toml: true },
		{
			harness: 'copilot-cli',
			scope: 'user',
			file: join(env['COPILOT_HOME'] ?? join(home, '.copilot'), 'mcp-config.json'),
			key: 'mcpServers',
		},
		{ harness: 'copilot-cli', scope: 'project', file: join(dir, '.copilot', 'mcp-config.json'), key: 'mcpServers' },
		{ harness: 'gemini', scope: 'user', file: join(home, '.gemini', 'settings.json'), key: 'mcpServers' },
		{ harness: 'gemini', scope: 'project', file: join(dir, '.gemini', 'settings.json'), key: 'mcpServers' },
		{ harness: 'vscode', scope: 'user', file: join(vscodeUserDir(env), 'mcp.json'), key: 'servers' },
		{ harness: 'vscode', scope: 'project', file: join(dir, '.vscode', 'mcp.json'), key: 'servers' },
		{
			harness: 'windsurf',
			scope: 'user',
			file: join(home, '.codeium', 'windsurf', 'mcp_config.json'),
			key: 'mcpServers',
		},
		{ harness: 'opencode', scope: 'user', file: join(xdg, 'opencode', 'opencode.json'), key: 'mcp' },
		{ harness: 'opencode', scope: 'project', file: join(dir, 'opencode.json'), key: 'mcp' },
		{ harness: 'zed', scope: 'user', file: join(xdg, 'zed', 'settings.json'), key: 'context_servers' },
		{ harness: 'zed', scope: 'project', file: join(dir, '.zed', 'settings.json'), key: 'context_servers' },
	]
}

/** JSON with comments and trailing commas, as VS Code and Zed write it. */
export function parseJsonc(text: string): unknown {
	let out = ''
	let inString = false
	for (let i = 0; i < text.length; i++) {
		const c = text[i]
		if (inString) {
			out += c
			if (c === '\\') out += text[++i] ?? ''
			else if (c === '"') inString = false
		} else if (c === '"') {
			inString = true
			out += c
		} else if (c === '/' && text[i + 1] === '/') {
			while (i < text.length && text[i] !== '\n') i++
			out += '\n'
		} else if (c === '/' && text[i + 1] === '*') {
			const end = text.indexOf('*/', i + 2)
			if (end < 0) break
			i = end + 1
		} else out += c
	}
	return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'))
}

export interface DescribedServer {
	name: string
	transport: 'remote' | 'stdio' | 'unknown'
	command: string | null
	args: string[]
	url: string | null
	disabled: boolean
	scope?: string
}

type RawServerEntry = {
	url?: unknown
	serverUrl?: unknown
	httpUrl?: unknown
	command?: unknown
	args?: unknown
	disabled?: unknown
	enabled?: unknown
}

/** The non-secret parts of one server entry. */
export function describeServer(name: string, entry: RawServerEntry): DescribedServer {
	const command = entry.command as string | string[] | { url?: string; path?: string } | undefined
	const url = (entry.url ??
		entry.serverUrl ??
		entry.httpUrl ??
		(typeof command === 'object' && !Array.isArray(command) ? command?.url : undefined)) as string | undefined
	let origin: string | null = null
	if (typeof url === 'string') {
		try {
			const u = new URL(url)
			origin = `${u.origin}${u.pathname}`
		} catch {
			origin = null
		}
	}
	const rawCommand =
		typeof command === 'string' ? command : Array.isArray(command) ? command[0] : (command?.path as string | undefined)
	const rawArgs: unknown[] = Array.isArray(command)
		? command.slice(1)
		: ((entry.args as unknown[] | undefined) ??
			(typeof command === 'object' && !Array.isArray(command) ? (command as { args?: unknown[] })?.args : undefined) ??
			[])
	// Keep only arguments that look like package, image, or binary names.
	const args = rawArgs.filter(
		(a): a is string => typeof a === 'string' && !a.includes('=') && !/token|key|secret|password|bearer/i.test(a),
	)
	return {
		name,
		transport: origin ? 'remote' : rawCommand ? 'stdio' : 'unknown',
		command: rawCommand ? basename(String(rawCommand)) : null,
		args,
		url: origin,
		disabled: entry.disabled === true || entry.enabled === false,
	}
}

function tomlServers(text: string): DescribedServer[] {
	const servers = new Map<string, RawServerEntry>()
	let current: string | null = null
	for (const line of text.split('\n')) {
		const header = /^\s*\[mcp_servers\.("?)([^\]"]+)\1(\.[^\]]+)?\]\s*$/.exec(line)
		if (header) {
			current = header[3] ? null : (header[2] ?? null)
			if (current) servers.set(current, {})
			continue
		}
		if (/^\s*\[/.test(line)) {
			current = null
			continue
		}
		if (!current) continue
		const kv = /^\s*(command|url|args|enabled)\s*=\s*(.+?)\s*$/.exec(line)
		if (!kv?.[1] || kv[2] === undefined) continue
		const entry = servers.get(current)
		if (!entry) continue
		const raw = entry as Record<string, unknown>
		if (kv[1] === 'args') raw['args'] = [...kv[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1])
		else if (kv[1] === 'enabled') raw['enabled'] = kv[2] === 'true'
		else raw[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1')
	}
	return [...servers].map(([name, entry]) => describeServer(name, entry))
}

export function matchKinds(server: DescribedServer): HostKind[] {
	const hay = [server.name, server.command, ...server.args, server.url].filter(Boolean).join(' ')
	return (Object.keys(MCP_SIGNATURES) as HostKind[]).filter((k) => MCP_SIGNATURES[k].some((re) => re.test(hay)))
}

interface PluginSource extends McpSource {
	flat: boolean
	disabled: boolean
}

/** MCP configs shipped by installed Claude Code plugins, with whether the plugin is enabled. */
function pluginSources(dir: string): PluginSource[] {
	const root = join(homedir(), '.claude')
	let installed: Record<string, { projectPath?: string; installPath?: string }[]> = {}
	try {
		installed =
			(
				JSON.parse(readFileSync(join(root, 'plugins', 'installed_plugins.json'), 'utf8')) as {
					plugins?: Record<string, { projectPath?: string; installPath?: string }[]>
				}
			).plugins ?? {}
	} catch {
		return []
	}
	const enabled: Record<string, boolean> = {}
	for (const file of [
		join(root, 'settings.json'),
		join(dir, '.claude', 'settings.json'),
		join(dir, '.claude', 'settings.local.json'),
	]) {
		try {
			Object.assign(
				enabled,
				(parseJsonc(readFileSync(file, 'utf8')) as { enabledPlugins?: Record<string, boolean> }).enabledPlugins ?? {},
			)
		} catch {}
	}
	const sources: PluginSource[] = []
	for (const [id, installs] of Object.entries(installed)) {
		for (const install of installs) {
			if (install.projectPath && resolve(install.projectPath) !== dir) continue
			const file = join(install.installPath ?? '', '.mcp.json')
			sources.push({
				harness: 'claude-code',
				scope: `plugin ${id}`,
				file,
				key: 'mcpServers',
				flat: true,
				disabled: enabled[id] !== true,
			})
		}
	}
	return sources
}

export interface McpEntry extends DescribedServer {
	harness: string
	file: string
	hosts: HostKind[]
}

export interface McpError {
	harness: string
	scope: string
	file: string
	error: string
}

export function collectMcp(dir: string, env: NodeJS.ProcessEnv, kinds: HostKind[]): (McpEntry | McpError)[] {
	const found: (McpEntry | McpError)[] = []
	for (const src of [...mcpSources(dir, env), ...pluginSources(dir)]) {
		if (!existsSync(src.file)) continue
		let servers: DescribedServer[] = []
		try {
			const text = readFileSync(src.file, 'utf8')
			if (src.toml) servers = tomlServers(text)
			else {
				const json = parseJsonc(text) as Record<string, unknown>
				const flat = 'flat' in src ? (src as PluginSource).flat : false
				// A plugin's .mcp.json may list servers at the top level instead of under mcpServers.
				const key = src.key ?? ''
				const blocks: (Record<string, RawServerEntry> | undefined)[] = [
					(flat && !json[key] ? json : json[key]) as Record<string, RawServerEntry> | undefined,
				]
				if (src.project) {
					const projects = json['projects'] as Record<string, Record<string, unknown>> | undefined
					blocks.push(projects?.[src.project]?.[key] as Record<string, RawServerEntry> | undefined)
				}
				for (const [i, block] of blocks.entries()) {
					for (const [name, entry] of Object.entries(block ?? {})) {
						if (entry && typeof entry === 'object')
							servers.push({ ...describeServer(name, entry), scope: i === 1 ? 'local' : src.scope })
					}
				}
			}
		} catch (error) {
			found.push({
				harness: src.harness,
				scope: src.scope,
				file: src.file,
				error: `unreadable: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}`,
			})
			continue
		}
		for (const s of servers) {
			const matches = matchKinds(s).filter((k) => kinds.includes(k))
			if (matches.length) {
				found.push({
					harness: src.harness,
					file: src.file,
					...s,
					scope: s.scope ?? src.scope,
					disabled: s.disabled || Boolean('disabled' in src && (src as PluginSource).disabled),
					hosts: matches,
				})
			}
		}
	}
	return found
}
