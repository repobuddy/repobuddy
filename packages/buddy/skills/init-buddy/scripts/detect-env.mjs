#!/usr/bin/env node
/**
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

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { arch, homedir, platform, release } from 'node:os'
import { basename, delimiter, join, resolve } from 'node:path'

// ── data ──────────────────────────────────────────────────────────────────────

const KINDS = ['github', 'gitlab', 'bitbucket', 'azure', 'gitea', 'forgejo']

const HOSTS = [
	[/(^|\.)github\.com$/, 'github'],
	[/(^|\.)bitbucket\.org$/, 'bitbucket'],
	[/(^|\.)(dev\.azure\.com|visualstudio\.com)$/, 'azure'],
	[/(^|\.)codeberg\.org$|forgejo/, 'forgejo'],
	[/gitea/, 'gitea'],
	[/(^|\.)gitlab\.com$|gitlab/, 'gitlab'],
	[/github/, 'github'],
]

/**
 * CLI per host kind. `install` lists recipes in preference order; each names the package manager
 * it needs, the OS families it applies to, and whether the vendor maintains it.
 */
export const CLIS = {
	github: {
		cli: 'gh',
		version: ['--version'],
		auth: (hostname) => ['auth', 'status', ...(hostname ? ['--hostname', hostname] : [])],
		login: (hostname) => `gh auth login${hostname ? ` --hostname ${hostname}` : ''}`,
		tokenEnv: ['GH_TOKEN', 'GITHUB_TOKEN', 'GH_ENTERPRISE_TOKEN'],
		docs: 'https://github.com/cli/cli#installation',
		install: [
			{ manager: 'brew', os: ['macos', 'linux'], official: true, commands: ['brew install gh'] },
			{ manager: 'winget', os: ['windows'], official: true, commands: ['winget install --id GitHub.cli'] },
			{ manager: 'scoop', os: ['windows'], official: false, commands: ['scoop install gh'] },
			{ manager: 'choco', os: ['windows'], official: false, commands: ['choco install gh'] },
			{
				manager: 'apt-get',
				os: ['debian'],
				official: true,
				sudo: true,
				commands: [
					'sudo mkdir -p -m 755 /etc/apt/keyrings',
					'wget -nv -O /tmp/githubcli-keyring.gpg https://cli.github.com/packages/githubcli-archive-keyring.gpg',
					'sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg < /tmp/githubcli-keyring.gpg > /dev/null',
					'sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg',
					'echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null',
					'sudo apt update',
					'sudo apt install gh',
				],
			},
			{
				manager: 'dnf',
				os: ['fedora', 'rhel'],
				official: true,
				sudo: true,
				commands: [
					'sudo dnf install dnf5-plugins',
					'sudo dnf config-manager addrepo --from-repofile=https://cli.github.com/packages/rpm/gh-cli.repo',
					'sudo dnf install gh --repo gh-cli',
				],
				note: 'dnf5 syntax; for dnf4 see the docs link',
			},
			{
				manager: 'zypper',
				os: ['suse'],
				official: true,
				sudo: true,
				commands: [
					'sudo zypper addrepo https://cli.github.com/packages/rpm/gh-cli.repo',
					'sudo zypper ref',
					'sudo zypper install gh',
				],
			},
			{ manager: 'pacman', os: ['arch'], official: false, sudo: true, commands: ['sudo pacman -S github-cli'] },
			{ manager: 'apk', os: ['alpine'], official: false, sudo: true, commands: ['sudo apk add github-cli'] },
			{ manager: 'nix', os: ['macos', 'linux'], official: false, commands: ['nix profile install nixpkgs#gh'] },
			{
				manager: 'conda',
				os: ['macos', 'linux', 'windows'],
				official: false,
				commands: ['conda install gh -c conda-forge'],
			},
		],
	},
	gitlab: {
		cli: 'glab',
		version: ['--version'],
		auth: (hostname) => ['auth', 'status', ...(hostname ? ['--hostname', hostname] : [])],
		// `glab auth status` can exit 0 while logged out.
		loggedOut: /not logged in|no token|unauthenticated|401/i,
		login: (hostname) => `glab auth login${hostname ? ` --hostname ${hostname}` : ''}`,
		tokenEnv: ['GITLAB_TOKEN', 'GITLAB_ACCESS_TOKEN', 'OAUTH_TOKEN'],
		docs: 'https://gitlab.com/gitlab-org/cli#installation',
		install: [
			{ manager: 'brew', os: ['macos', 'linux'], official: true, commands: ['brew install glab'] },
			{ manager: 'winget', os: ['windows'], official: true, commands: ['winget install glab.glab'] },
			{ manager: 'scoop', os: ['windows'], official: false, commands: ['scoop install glab'] },
			{ manager: 'choco', os: ['windows'], official: false, commands: ['choco install glab'] },
			{ manager: 'dnf', os: ['fedora'], official: false, sudo: true, commands: ['sudo dnf install glab'] },
			{ manager: 'pacman', os: ['arch'], official: false, sudo: true, commands: ['sudo pacman -S glab'] },
			{ manager: 'apk', os: ['alpine'], official: false, sudo: true, commands: ['sudo apk add glab'] },
			{ manager: 'snap', os: ['linux'], official: false, sudo: true, commands: ['sudo snap install glab'] },
			{ manager: 'nix', os: ['macos', 'linux'], official: false, commands: ['nix profile install nixpkgs#glab'] },
			{
				manager: null,
				os: ['debian', 'rhel', 'suse'],
				official: true,
				commands: [],
				note: 'download the .deb or .rpm from https://gitlab.com/gitlab-org/cli/-/releases and install it with the system package manager',
			},
		],
	},
	gitea: {
		cli: 'tea',
		version: ['--version'],
		auth: () => ['whoami'],
		authReliable: false,
		login: (hostname) => `tea login add --url https://${hostname ?? '<instance>'} --token <token>`,
		tokenEnv: [],
		docs: 'https://gitea.com/gitea/tea#installation',
		install: [
			{ manager: 'brew', os: ['macos', 'linux'], official: false, commands: ['brew install tea'] },
			{ manager: 'scoop', os: ['windows'], official: false, commands: ['scoop install tea'] },
			{
				manager: 'go',
				os: ['macos', 'linux', 'windows'],
				official: true,
				commands: ['go install code.gitea.io/tea@latest'],
			},
			{
				manager: null,
				os: ['macos', 'linux', 'windows'],
				official: true,
				commands: [],
				note: 'download a binary from https://dl.gitea.com/tea/',
			},
		],
	},
	forgejo: {
		cli: 'fj',
		version: ['--version'],
		auth: (hostname) => [...(hostname ? ['--host', hostname] : []), 'whoami'],
		authReliable: false,
		login: (hostname) => `fj${hostname ? ` --host ${hostname}` : ''} auth login`,
		tokenEnv: [],
		docs: 'https://codeberg.org/forgejo-contrib/forgejo-cli',
		install: [
			{ manager: 'brew', os: ['macos', 'linux'], official: false, commands: ['brew install forgejo-cli'] },
			{
				manager: 'cargo',
				os: ['macos', 'linux', 'windows'],
				official: false,
				commands: ['cargo install --locked forgejo-cli'],
			},
			{
				manager: 'apt-get',
				os: ['debian'],
				official: false,
				sudo: true,
				commands: ['sudo apt install forgejo-cli'],
				note: 'only in Debian unstable and Ubuntu 25.10 or later',
				when: (os) =>
					os.distro?.id === 'ubuntu'
						? Number.parseFloat(os.distro.version ?? '0') >= 25.1
						: os.distro?.id === 'debian' && !os.distro.version,
			},
			{
				manager: 'nix',
				os: ['macos', 'linux'],
				official: false,
				commands: ['nix profile install git+https://codeberg.org/forgejo-contrib/forgejo-cli'],
			},
			{
				manager: null,
				os: ['linux', 'windows'],
				official: false,
				commands: [],
				note: 'download a binary from https://codeberg.org/forgejo-contrib/forgejo-cli/releases',
			},
		],
	},
	azure: {
		cli: 'az',
		version: ['version', '--output', 'json'],
		auth: () => ['account', 'show', '--output', 'none'],
		login: () => 'az login',
		postInstall: ['az extension add --name azure-devops'],
		tokenEnv: ['AZURE_DEVOPS_EXT_PAT'],
		docs: 'https://learn.microsoft.com/cli/azure/install-azure-cli',
		install: [
			{ manager: 'brew', os: ['macos', 'linux'], official: true, commands: ['brew install azure-cli'] },
			{
				manager: 'winget',
				os: ['windows'],
				official: true,
				commands: ['winget install --exact --id Microsoft.AzureCLI'],
			},
			{
				manager: 'apt-get',
				os: ['debian'],
				official: true,
				sudo: true,
				commands: ['curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash'],
				note: 'runs a Microsoft script as root; show it to the user first',
			},
			{
				manager: null,
				os: ['fedora', 'rhel', 'suse'],
				official: true,
				commands: [],
				note: 'add the Microsoft package repository for this distro version, per the docs link',
			},
		],
	},
	bitbucket: {
		cli: null,
		note: 'Bitbucket Cloud has no official CLI; use the Atlassian remote MCP server or the REST API with an access token',
		install: [],
	},
}

/** Distinctive substrings of MCP server configs, per host kind. Matched against name, command, args, and URL. */
export const MCP_SIGNATURES = {
	github: [/github/i, /githubcopilot\.com\/mcp/i],
	gitlab: [/gitlab/i, /\/api\/v4\/mcp/i],
	bitbucket: [/bitbucket/i, /mcp\.atlassian\.com/i, /atlassian-mcp/i],
	azure: [/azure-devops/i, /dev\.azure\.com/i, /\bado\b/i],
	gitea: [/gitea/i],
	forgejo: [/forgejo/i, /codeberg/i],
}

const MANAGERS = [
	'brew',
	'winget',
	'scoop',
	'choco',
	'apt-get',
	'dnf',
	'yum',
	'pacman',
	'zypper',
	'apk',
	'nix',
	'snap',
	'conda',
	'port',
	'go',
	'cargo',
]

// ── args ──────────────────────────────────────────────────────────────────────

function usage(message) {
	process.stderr.write(`${message}\n`)
	process.stderr.write('usage: detect-env.mjs [--dir <repo>] [--host <kind[=hostname]>]... [--probe] [--json]\n')
	process.exit(2)
}

function parseArgs(argv) {
	const opts = { hosts: [] }
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]
		if (a === '--dir' || a === '--host') {
			if (argv[i + 1] === undefined) usage(`${a} needs a value`)
			if (a === '--dir') opts.dir = argv[++i]
			else opts.hosts.push(argv[++i])
		} else if (a === '--json' || a === '--probe') opts[a.slice(2)] = true
		else usage(`unknown argument "${a}"`)
	}
	return opts
}

// ── os ────────────────────────────────────────────────────────────────────────

export function parseOsRelease(text) {
	const out = {}
	for (const line of text.split('\n')) {
		const m = /^([A-Z_]+)=(.*)$/.exec(line.trim())
		if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
	}
	return out
}

/** Collapse a distro ID and ID_LIKE into the family install recipes are written for. */
export function distroFamily(id = '', idLike = '') {
	const ids = [id, ...idLike.split(/\s+/)].map((s) => s.toLowerCase()).filter(Boolean)
	const has = (...names) => names.some((n) => ids.includes(n))
	if (has('alpine')) return 'alpine'
	if (has('arch', 'archlinux')) return 'arch'
	if (has('nixos')) return 'nixos'
	if (has('fedora') && !has('rhel', 'centos')) return 'fedora'
	if (has('rhel', 'centos', 'rocky', 'almalinux', 'ol', 'amzn')) return 'rhel'
	if (has('suse', 'opensuse', 'sles') || ids.some((i) => i.startsWith('opensuse'))) return 'suse'
	if (has('debian', 'ubuntu')) return 'debian'
	return 'other'
}

function detectOs(env) {
	const plat = platform()
	const os = { platform: plat, arch: arch(), release: release(), wsl: false }
	if (plat === 'darwin') {
		os.family = 'macos'
		os.version = run('sw_vers', ['-productVersion']).stdout || null
	} else if (plat === 'win32') {
		os.family = 'windows'
	} else if (plat === 'linux') {
		os.wsl = Boolean(env.WSL_DISTRO_NAME) || /microsoft/i.test(readText('/proc/version'))
		const rel = parseOsRelease(readText('/etc/os-release'))
		os.distro = {
			id: rel.ID ?? null,
			idLike: rel.ID_LIKE ?? null,
			version: rel.VERSION_ID ?? null,
			name: rel.PRETTY_NAME ?? null,
		}
		os.family = distroFamily(rel.ID, rel.ID_LIKE)
	} else {
		os.family = 'other'
	}
	if (plat !== 'win32') {
		if (typeof process.getuid === 'function' && process.getuid() === 0) os.sudo = 'root'
		else if (!which('sudo', env)) os.sudo = 'absent'
		else os.sudo = run('sudo', ['-n', 'true']).status === 0 ? 'passwordless' : 'needs-password'
	}
	return os
}

// ── helpers ───────────────────────────────────────────────────────────────────

function readText(file) {
	try {
		return readFileSync(file, 'utf8')
	} catch {
		return ''
	}
}

function run(cmd, args, opts = {}) {
	const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: 10_000, stdio: ['ignore', 'pipe', 'pipe'], ...opts })
	return { status: r.error ? null : r.status, stdout: (r.stdout ?? '').trim(), stderr: (r.stderr ?? '').trim() }
}

export function which(name, env = process.env) {
	const exts = platform() === 'win32' ? (env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';') : ['']
	for (const dir of (env.PATH ?? env.Path ?? '').split(delimiter)) {
		if (!dir) continue
		for (const ext of exts) {
			const file = join(dir, name + ext)
			try {
				if (statSync(file).isFile()) return file
			} catch {}
		}
	}
	return null
}

// ── hosts ─────────────────────────────────────────────────────────────────────

export function remoteHost(url) {
	const m = /^(?:[a-z+]+:\/\/)?(?:[^@/]+@)?([^/:]+)/i.exec(url ?? '')
	return m?.[1].toLowerCase() ?? null
}

export function hostKind(hostname) {
	return (hostname && HOSTS.find(([re]) => re.test(hostname))?.[1]) ?? null
}

const PUBLIC = {
	'github.com': 'github',
	'gitlab.com': 'gitlab',
	'bitbucket.org': 'bitbucket',
	'dev.azure.com': 'azure',
	'gitea.com': 'gitea',
	'codeberg.org': 'forgejo',
}

async function probe(hostname) {
	const get = async (path) => {
		try {
			const res = await fetch(`https://${hostname}${path}`, { signal: AbortSignal.timeout(5000) })
			return { status: res.status, body: await res.text() }
		} catch {
			return { status: 0, body: '' }
		}
	}
	const v1 = await get('/api/v1/version')
	if (v1.status === 200 && /"version"/.test(v1.body)) return /forgejo|\+gitea/i.test(v1.body) ? 'forgejo' : 'gitea'
	const v4 = await get('/api/v4/version')
	if ([200, 401].includes(v4.status) && /version|Unauthorized/.test(v4.body)) return 'gitlab'
	const v3 = await get('/api/v3/meta')
	if (v3.status === 200 && /installed_version|verifiable_password_authentication/.test(v3.body)) return 'github'
	return null
}

async function collectHosts(dir, requested, doProbe) {
	const byName = new Map()
	const add = (hostname, kind, remote) => {
		const key = hostname ?? kind
		const entry = byName.get(key) ?? { hostname, kind, remotes: [], selfHosted: hostname ? !PUBLIC[hostname] : false }
		if (!entry.kind && kind) entry.kind = kind
		if (remote && !entry.remotes.includes(remote)) entry.remotes.push(remote)
		byName.set(key, entry)
	}
	if (requested.length) {
		for (const spec of requested) {
			const [kind, hostname] = spec.split('=')
			if (!KINDS.includes(kind)) usage(`--host must be one of ${KINDS.join(', ')}`)
			add(hostname ?? Object.keys(PUBLIC).find((h) => PUBLIC[h] === kind), kind)
		}
	} else {
		const out = run('git', ['-C', dir, 'remote', '-v']).stdout
		for (const line of out.split('\n')) {
			const [name, url] = line.split(/\s+/)
			if (!url) continue
			const hostname = remoteHost(url)
			add(hostname, PUBLIC[hostname] ?? hostKind(hostname), name)
		}
	}
	const hosts = [...byName.values()]
	for (const h of hosts) {
		if (doProbe && h.selfHosted && h.hostname) {
			const probed = await probe(h.hostname)
			if (probed) {
				h.kind = probed
				h.probed = true
			}
		}
	}
	return hosts
}

function describeCli(host, os, managers, env) {
	const spec = CLIS[host.kind]
	if (!spec) return null
	if (!spec.cli) return { name: null, note: spec.note, install: [] }
	const path = which(spec.cli, env)
	const cli = { name: spec.cli, installed: Boolean(path), path, version: null, authenticated: null }
	if (path) {
		const v = run(path, spec.version)
		cli.version = v.stdout.split('\n')[0] || null
		const hostArg = host.selfHosted ? host.hostname : undefined
		const a = run(path, spec.auth(hostArg), { env: { ...env, GH_PROMPT_DISABLED: '1', NO_COLOR: '1' } })
		const loggedOut = spec.loggedOut?.test(`${a.stdout}\n${a.stderr}`)
		if (a.status === null) cli.authenticated = null
		else if (a.status === 0 && !loggedOut) cli.authenticated = true
		else cli.authenticated = spec.authReliable === false ? null : false
	}
	cli.login = spec.login(host.selfHosted ? host.hostname : undefined)
	cli.tokenEnv = spec.tokenEnv.filter((n) => env[n]).map((n) => `${n} is set`)
	cli.install = path ? [] : installOptions(spec, os, managers)
	cli.postInstall = spec.postInstall ?? []
	cli.docs = spec.docs
	return cli
}

export function installOptions(spec, os, managers) {
	return spec.install
		.filter((r) => r.os.includes(os.family) || (r.os.includes('linux') && os.platform === 'linux'))
		.filter((r) => !r.manager || managers.includes(r.manager))
		.filter((r) => !r.when || r.when(os))
		.map((r) => ({
			manager: r.manager ?? null,
			official: r.official,
			sudo: Boolean(r.sudo),
			commands: r.commands,
			note: r.note,
		}))
}

// ── mcp ───────────────────────────────────────────────────────────────────────

function vscodeUserDir(env) {
	const home = homedir()
	if (platform() === 'win32') return join(env.APPDATA ?? join(home, 'AppData', 'Roaming'), 'Code', 'User')
	if (platform() === 'darwin') return join(home, 'Library', 'Application Support', 'Code', 'User')
	return join(env.XDG_CONFIG_HOME ?? join(home, '.config'), 'Code', 'User')
}

function mcpSources(dir, env) {
	const home = homedir()
	const xdg = env.XDG_CONFIG_HOME ?? join(home, '.config')
	return [
		{ harness: 'claude-code', scope: 'user', file: join(home, '.claude.json'), key: 'mcpServers', project: dir },
		{ harness: 'claude-code', scope: 'project', file: join(dir, '.mcp.json'), key: 'mcpServers' },
		{ harness: 'cursor', scope: 'user', file: join(home, '.cursor', 'mcp.json'), key: 'mcpServers' },
		{ harness: 'cursor', scope: 'project', file: join(dir, '.cursor', 'mcp.json'), key: 'mcpServers' },
		{ harness: 'codex', scope: 'user', file: join(env.CODEX_HOME ?? join(home, '.codex'), 'config.toml'), toml: true },
		{ harness: 'codex', scope: 'project', file: join(dir, '.codex', 'config.toml'), toml: true },
		{
			harness: 'copilot-cli',
			scope: 'user',
			file: join(env.COPILOT_HOME ?? join(home, '.copilot'), 'mcp-config.json'),
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
export function parseJsonc(text) {
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
			i = text.indexOf('*/', i + 2)
			if (i < 0) break
			i++
		} else out += c
	}
	return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'))
}

/** The non-secret parts of one server entry. */
export function describeServer(name, entry) {
	const url = entry.url ?? entry.serverUrl ?? entry.httpUrl ?? entry.command?.url ?? null
	let origin = null
	if (typeof url === 'string') {
		try {
			const u = new URL(url)
			origin = `${u.origin}${u.pathname}`
		} catch {
			origin = null
		}
	}
	const rawCommand =
		typeof entry.command === 'string'
			? entry.command
			: Array.isArray(entry.command)
				? entry.command[0]
				: entry.command?.path
	const rawArgs = Array.isArray(entry.command) ? entry.command.slice(1) : (entry.args ?? entry.command?.args ?? [])
	// Keep only arguments that look like package, image, or binary names.
	const args = rawArgs.filter(
		(a) => typeof a === 'string' && !a.includes('=') && !/token|key|secret|password|bearer/i.test(a),
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

function tomlServers(text) {
	const servers = new Map()
	let current = null
	for (const line of text.split('\n')) {
		const header = /^\s*\[mcp_servers\.("?)([^\]"]+)\1(\.[^\]]+)?\]\s*$/.exec(line)
		if (header) {
			current = header[3] ? null : header[2]
			if (current) servers.set(current, {})
			continue
		}
		if (/^\s*\[/.test(line)) {
			current = null
			continue
		}
		if (!current) continue
		const kv = /^\s*(command|url|args|enabled)\s*=\s*(.+?)\s*$/.exec(line)
		if (!kv) continue
		const entry = servers.get(current)
		if (kv[1] === 'args') entry.args = [...kv[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1])
		else if (kv[1] === 'enabled') entry.enabled = kv[2] === 'true'
		else entry[kv[1]] = kv[2].replace(/^"(.*)"$/, '$1')
	}
	return [...servers].map(([name, entry]) => describeServer(name, entry))
}

export function matchKinds(server) {
	const hay = [server.name, server.command, ...server.args, server.url].filter(Boolean).join(' ')
	return Object.keys(MCP_SIGNATURES).filter((k) => MCP_SIGNATURES[k].some((re) => re.test(hay)))
}

/** MCP configs shipped by installed Claude Code plugins, with whether the plugin is enabled. */
function pluginSources(dir) {
	const root = join(homedir(), '.claude')
	let installed = {}
	try {
		installed = JSON.parse(readFileSync(join(root, 'plugins', 'installed_plugins.json'), 'utf8')).plugins ?? {}
	} catch {
		return []
	}
	const enabled = {}
	for (const file of [
		join(root, 'settings.json'),
		join(dir, '.claude', 'settings.json'),
		join(dir, '.claude', 'settings.local.json'),
	]) {
		try {
			Object.assign(enabled, parseJsonc(readFileSync(file, 'utf8')).enabledPlugins ?? {})
		} catch {}
	}
	const sources = []
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

function collectMcp(dir, env, kinds) {
	const found = []
	for (const src of [...mcpSources(dir, env), ...pluginSources(dir)]) {
		if (!existsSync(src.file)) continue
		let servers = []
		try {
			const text = readFileSync(src.file, 'utf8')
			if (src.toml) servers = tomlServers(text)
			else {
				const json = parseJsonc(text)
				// A plugin's .mcp.json may list servers at the top level instead of under mcpServers.
				const blocks = [src.flat && !json?.[src.key] ? json : json?.[src.key]]
				if (src.project) blocks.push(json?.projects?.[src.project]?.[src.key])
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
				error: `unreadable: ${error.message.split('\n')[0]}`,
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
					disabled: s.disabled || Boolean(src.disabled),
					hosts: matches,
				})
			}
		}
	}
	return found
}

// ── main ──────────────────────────────────────────────────────────────────────

export async function detect({ dir, hosts: requested = [], probe: doProbe = false, env = process.env }) {
	const os = detectOs(env)
	const managers = MANAGERS.filter((m) => which(m, env))
	const hosts = await collectHosts(dir, requested, doProbe)
	for (const h of hosts) h.cli = describeCli(h, os, managers, env)
	const kinds = [...new Set(hosts.map((h) => h.kind).filter(Boolean))]
	return { dir, os, managers, hosts, mcp: collectMcp(dir, env, kinds) }
}

function printSummary(r) {
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
		if (!c.installed && c.postInstall.length) lines.push(`    then: ${c.postInstall.join(' && ')}`)
		if (!c.installed) lines.push(`    docs: ${c.docs}`)
	}
	const mcp = r.mcp.filter((m) => !m.error)
	lines.push(`mcp servers for these hosts: ${mcp.length ? '' : 'none found'}`)
	for (const m of mcp) {
		lines.push(
			`  ${m.name} (${m.hosts.join(', ')}) — ${m.harness} ${m.scope}, ${m.url ?? [m.command, ...m.args].join(' ')}${m.disabled ? ', disabled' : ''}`,
		)
	}
	for (const m of r.mcp.filter((x) => x.error)) lines.push(`  ${m.file}: ${m.error}`)
	process.stdout.write(`${lines.join('\n')}\n`)
}

if (process.argv[1]?.endsWith('detect-env.mjs')) {
	const opts = parseArgs(process.argv.slice(2))
	const result = await detect({ dir: resolve(opts.dir ?? process.cwd()), hosts: opts.hosts, probe: opts.probe })
	if (opts.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
	else printSummary(result)
}
