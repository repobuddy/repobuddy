/**
 * Lists what a repository configures to put content into an agent's context before the user types:
 * hooks that run at session start or on each prompt, and the MCP servers it declares. These are a
 * prompt-injection surface when they fetch outside content, but whether one does is a judgment the
 * script cannot make, so they are reported and never scored.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

interface ContextHook {
	/** The config file that declares it. */
	file: string
	event: string
	command: string
}

interface McpServer {
	file: string
	name: string
	/** The command line for a stdio server, or the URL for a remote one. */
	target: string
}

export interface InjectionSurface {
	hooks: ContextHook[]
	mcpServers: McpServer[]
}

/** Files whose `hooks` map events to `[{ matcher?, hooks: [{ type, command }] }]` (Claude Code, Gemini CLI). */
const NESTED_HOOK_FILES = ['.claude/settings.json', '.claude/settings.local.json', '.gemini/settings.json']
/** Files whose `hooks` map events straight to `[{ command }]` (Cursor), or `[{ bash, powershell }]` (Copilot). */
const FLAT_HOOK_FILES = ['.cursor/hooks.json']
const COPILOT_HOOK_DIR = '.github/hooks'
const MCP_FILES = ['.mcp.json', '.cursor/mcp.json', '.vscode/mcp.json']

/**
 * Events whose hook output reaches the model's context: session start, and each submitted prompt.
 * Compared lowercased, since the harnesses disagree on case (`SessionStart`, `sessionStart`).
 */
const CONTEXT_EVENTS = new Set([
	'sessionstart',
	'userpromptsubmit',
	'userpromptsubmitted',
	'beforesubmitprompt',
	'beforeagent',
])

function readJson(dir: string, file: string): unknown {
	try {
		return JSON.parse(readFileSync(join(dir, file), 'utf8'))
	} catch {
		return undefined
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function commandOf(entry: unknown): string | undefined {
	if (!isRecord(entry)) return undefined
	for (const key of ['command', 'bash', 'powershell']) {
		if (typeof entry[key] === 'string') return entry[key]
	}
	return undefined
}

function contextEvents(config: unknown): Array<[string, unknown[]]> {
	if (!isRecord(config) || !isRecord(config['hooks'])) return []
	return Object.entries(config['hooks']).filter(
		(e): e is [string, unknown[]] => CONTEXT_EVENTS.has(e[0].toLowerCase()) && Array.isArray(e[1]),
	)
}

function readHooks(dir: string): ContextHook[] {
	const hooks: ContextHook[] = []
	const add = (file: string, event: string, entry: unknown) => {
		const command = commandOf(entry)
		if (command) hooks.push({ file, event, command })
	}
	for (const file of NESTED_HOOK_FILES) {
		for (const [event, groups] of contextEvents(readJson(dir, file))) {
			for (const group of groups) {
				const inner = isRecord(group) ? group['hooks'] : undefined
				for (const entry of Array.isArray(inner) ? inner : []) add(file, event, entry)
			}
		}
	}
	const flatFiles = [...FLAT_HOOK_FILES]
	if (existsSync(join(dir, COPILOT_HOOK_DIR))) {
		for (const name of readdirSync(join(dir, COPILOT_HOOK_DIR)).sort()) {
			if (name.endsWith('.json')) flatFiles.push(`${COPILOT_HOOK_DIR}/${name}`)
		}
	}
	for (const file of flatFiles) {
		for (const [event, entries] of contextEvents(readJson(dir, file))) {
			for (const entry of entries) add(file, event, entry)
		}
	}
	return hooks
}

function readMcpServers(dir: string): McpServer[] {
	const servers: McpServer[] = []
	for (const file of MCP_FILES) {
		const config = readJson(dir, file)
		if (!isRecord(config)) continue
		// VS Code names the map `servers`; the others name it `mcpServers`.
		const map = isRecord(config['mcpServers']) ? config['mcpServers'] : config['servers']
		if (!isRecord(map)) continue
		for (const [name, server] of Object.entries(map)) {
			if (!isRecord(server)) continue
			const args = Array.isArray(server['args']) ? server['args'].filter((a) => typeof a === 'string') : []
			const target =
				typeof server['command'] === 'string'
					? [server['command'], ...args].join(' ')
					: typeof server['url'] === 'string'
						? server['url']
						: ''
			servers.push({ file, name, target })
		}
	}
	return servers
}

export function readInjectionSurface(dir: string): InjectionSurface {
	return { hooks: readHooks(dir), mcpServers: readMcpServers(dir) }
}
