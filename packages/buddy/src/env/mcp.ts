import { homedir } from 'node:os'
import { type ListMcpServersOptions, listMcpServers, type McpServerEntry } from 'buddy-agent-harness'
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

/** The parts of an `McpServerEntry` that a git-host signature is matched against. */
interface MatchableServer {
	name: string
	command?: string | undefined
	args: readonly string[]
	url?: string | undefined
}

export function matchKinds(server: MatchableServer): HostKind[] {
	const hay = [server.name, server.command, ...server.args, server.url].filter(Boolean).join(' ')
	return (Object.keys(MCP_SIGNATURES) as HostKind[]).filter((k) => MCP_SIGNATURES[k].some((re) => re.test(hay)))
}

export interface McpEntry {
	harness: string
	scope: string
	file: string
	name: string
	transport: 'remote' | 'stdio' | 'unknown'
	command: string | null
	args: string[]
	url: string | null
	disabled: boolean
	hosts: HostKind[]
	plugin?: string
}

/**
 * MCP servers already configured for the given git-host kinds, across every agent harness
 * `buddy-agent-harness`'s `listMcpServers` reads: Claude Code (user/project/local/plugin), Cursor,
 * Codex, Copilot CLI, Gemini CLI, VS Code (user/project), Windsurf (reported under the harness name
 * `devin-desktop`), OpenCode, and Zed.
 *
 * A config file that cannot be read is skipped by `listMcpServers` rather than surfaced as an error:
 * there is no error-reporting output path here any more.
 */
export function collectMcp(
	dir: string,
	env: NodeJS.ProcessEnv,
	kinds: HostKind[],
	home: string = homedir(),
): McpEntry[] {
	const options: ListMcpServersOptions = { projectDir: dir, homeDir: home, env }
	const found: McpEntry[] = []
	for (const server of listMcpServers(options)) {
		const matches = matchKinds(server).filter((k) => kinds.includes(k))
		if (!matches.length) continue
		found.push(toMcpEntry(server, matches))
	}
	return found
}

function toMcpEntry(server: McpServerEntry, hosts: HostKind[]): McpEntry {
	return {
		harness: server.harness,
		scope: server.scope,
		file: server.configFile,
		name: server.name,
		transport:
			server.transport === 'http' || server.transport === 'sse'
				? 'remote'
				: server.transport === 'stdio'
					? 'stdio'
					: 'unknown',
		command: server.command ?? null,
		args: [...server.args],
		url: server.url ?? null,
		disabled: !server.enabled,
		hosts,
		...(server.plugin ? { plugin: server.plugin } : {}),
	}
}
