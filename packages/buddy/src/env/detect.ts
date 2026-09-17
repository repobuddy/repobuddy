import type { HostKind } from '../git-host.js'
import type { HostEntry } from './clis.js'
import { describeCli, MANAGERS } from './clis.js'
import { collectHosts } from './hosts.js'
import { collectMcp, type McpEntry, type McpError } from './mcp.js'
import { detectOs, type OsInfo, which } from './os.js'

export interface DetectOptions {
	dir: string
	hosts?: string[]
	probe?: boolean
	env?: NodeJS.ProcessEnv
}

export interface DetectResult {
	dir: string
	os: OsInfo
	managers: string[]
	hosts: HostEntry[]
	mcp: (McpEntry | McpError)[]
}

export async function detect({
	dir,
	hosts: requested = [],
	probe: doProbe = false,
	env = process.env,
}: DetectOptions): Promise<DetectResult> {
	const os = detectOs(env)
	const managers = MANAGERS.filter((m) => which(m, env))
	const hosts = await collectHosts(dir, requested, doProbe)
	for (const h of hosts) h.cli = describeCli(h, os, managers, env)
	const kinds = [...new Set(hosts.map((h) => h.kind).filter((k): k is HostKind => k !== null))]
	return { dir, os, managers, hosts, mcp: collectMcp(dir, env, kinds) }
}
