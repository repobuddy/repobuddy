/*
 * Detect what an agent needs to work with a repository's git host.
 *
 *   node scripts/detect-env.mjs [--dir <repo>] [--host <kind[=hostname]>]... [--probe] [--json]
 *
 * Reports:
 *   os        platform, arch, WSL, Linux distro family, and whether sudo is usable
 *   managers  package managers on PATH
 *   hosts     git hosts from the repo's remotes (or --host), each with its CLI: installed, version,
 *             authenticated, and the install commands that fit this machine
 *   mcp       MCP servers already configured for those hosts, across agent harnesses
 *
 * --host takes github|gitlab|bitbucket|azure|gitea|forgejo, optionally `=hostname` for a self-hosted
 * instance. --probe asks an unknown hostname's API which product it runs (network).
 *
 * MCP entries are reported by name, command, package, and URL origin only. Environment values,
 * headers, and URL query strings are never read into the output: they often hold tokens.
 *
 * stdout: a human summary, or JSON with --json. Exit 0 when detection ran, 2 on bad usage.
 */

import { resolve } from 'node:path'
import { type DetectResult, detect } from '../env/detect.js'

function usage(message: string): never {
	process.stderr.write(`${message}\n`)
	process.stderr.write('usage: detect-env.mjs [--dir <repo>] [--host <kind[=hostname]>]... [--probe] [--json]\n')
	process.exit(2)
}

interface Opts {
	hosts: string[]
	dir?: string
	json?: boolean
	probe?: boolean
}

function parseArgs(argv: string[]): Opts {
	const opts: Opts = { hosts: [] }
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i] as string
		if (a === '--dir' || a === '--host') {
			const value = argv[i + 1]
			if (value === undefined) usage(`${a} needs a value`)
			if (a === '--dir') opts.dir = value
			else opts.hosts.push(value)
			i++
		} else if (a === '--json' || a === '--probe') (opts as unknown as Record<string, boolean>)[a.slice(2)] = true
		else usage(`unknown argument "${a}"`)
	}
	return opts
}

// Exported for direct unit testing of every summary-line branch, including OS/host/CLI/MCP shapes
// that would otherwise only occur on machines this test suite must not depend on (a real macOS box,
// a real WSL session, etc).
export function printSummary(r: DetectResult): void {
	const o = r.os
	const lines = [
		`os: ${o.family}${o.distro?.name ? ` (${o.distro.name})` : o.version ? ` ${o.version}` : ''} ${o.arch}${o.wsl ? ', WSL' : ''}${o.sudo ? `, sudo: ${o.sudo}` : ''}`,
		`package managers: ${r.managers.join(', ') || 'none found'}`,
	]
	if (!r.hosts.length) lines.push('hosts: none (no git remotes; pass --host)')
	for (const h of r.hosts) {
		lines.push(
			`host: ${h.hostname ?? '?'} → ${h.kind ?? 'unknown'}${h.selfHosted ? ' (self-hosted)' : ''}${h.remotes.length ? ` [${h.remotes.join(', ')}]` : ''}`,
		)
		const c = h.cli
		if (!c) continue
		if (!c.name) {
			lines.push(`  cli: ${c.note}`)
			continue
		}
		lines.push(
			c.installed
				? `  cli: ${c.name} ${c.version ?? ''} — ${c.authenticated === true ? 'authenticated' : c.authenticated === false ? `not authenticated (run: ${c.login})` : 'auth unknown'}`
				: `  cli: ${c.name} not installed${c.install.length ? ', install options:' : ' — no install recipe for this machine'}`,
		)
		for (const i of c.install) {
			const how = i.commands.length ? i.commands.join(' && ') : i.note
			lines.push(
				`    ${i.official ? 'official' : 'community'} via ${i.manager ?? 'download'}: ${how}${i.commands.length && i.note ? ` (${i.note})` : ''}`,
			)
		}
		if (!c.installed && c.postInstall?.length) lines.push(`    then: ${c.postInstall.join(' && ')}`)
		if (!c.installed) lines.push(`    docs: ${c.docs}`)
	}
	lines.push(`mcp servers for these hosts: ${r.mcp.length ? '' : 'none found'}`)
	for (const m of r.mcp) {
		lines.push(
			`  ${m.name} (${m.hosts.join(', ')}) — ${m.harness} ${m.scope}, ${m.url ?? [m.command, ...m.args].join(' ')}${m.disabled ? ', disabled' : ''}`,
		)
	}
	process.stdout.write(`${lines.join('\n')}\n`)
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
	const opts = parseArgs(argv)
	const result = await detect({
		dir: resolve(opts.dir ?? process.cwd()),
		hosts: opts.hosts,
		probe: Boolean(opts.probe),
	})
	if (opts.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
	else printSummary(result)
}

// Process-boundary guard: only fires when the bundle runs directly as a script (verified by
// src/skills/bundles.spec.ts spawning the built bundle as a child process). Excluded narrowly
// because exercising it in-process would require redefining what "running under jest" means.
/* istanbul ignore next -- process.argv entrypoint guard, covered by bundles.spec.ts (child process) */
if (process.argv[1]?.endsWith('detect-env.mjs')) await main()
