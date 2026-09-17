import type { HostKind } from '../git-host.js'
import type { OsFamily, OsInfo } from './os.js'
import { run, which } from './os.js'

/** `'linux'` is a wildcard matched by platform, not by `OsFamily` (which distinguishes distros). */
type InstallOs = OsFamily | 'linux'

interface InstallRecipe {
	manager: string | null
	os: InstallOs[]
	official: boolean
	sudo?: boolean
	commands: string[]
	note?: string
	when?: (os: OsInfo) => boolean
}

export interface CliSpec {
	cli: string | null
	version?: string[]
	auth?: (hostname?: string) => string[]
	loggedOut?: RegExp
	authReliable?: boolean
	login?: (hostname?: string) => string
	postInstall?: string[]
	tokenEnv?: string[]
	docs?: string
	note?: string
	install: InstallRecipe[]
}

/**
 * CLI per host kind. `install` lists recipes in preference order; each names the package manager
 * it needs, the OS families it applies to, and whether the vendor maintains it.
 */
export const CLIS: Record<HostKind, CliSpec> = {
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

export const MANAGERS: string[] = [
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

export interface InstallOption {
	manager: string | null
	official: boolean
	sudo: boolean
	commands: string[]
	note?: string
}

export function installOptions(spec: CliSpec, os: OsInfo, managers: string[]): InstallOption[] {
	return spec.install
		.filter((r) => r.os.includes(os.family) || (r.os.includes('linux') && os.platform === 'linux'))
		.filter((r) => !r.manager || managers.includes(r.manager))
		.filter((r) => !r.when || r.when(os))
		.map((r) => {
			const out: InstallOption = {
				manager: r.manager ?? null,
				official: r.official,
				sudo: Boolean(r.sudo),
				commands: r.commands,
			}
			if (r.note !== undefined) out.note = r.note
			return out
		})
}

export interface CliStatus {
	name: string | null
	note?: string
	installed?: boolean
	path?: string | null
	version?: string | null
	authenticated?: boolean | null
	login?: string
	tokenEnv?: string[]
	install: InstallOption[]
	postInstall?: string[]
	docs?: string
}

export interface HostEntry {
	hostname: string | null
	kind: HostKind | null
	remotes: string[]
	selfHosted: boolean
	probed?: boolean
	cli?: CliStatus | null
}

export function describeCli(host: HostEntry, os: OsInfo, managers: string[], env: NodeJS.ProcessEnv): CliStatus | null {
	if (!host.kind) return null
	const spec = CLIS[host.kind]
	if (!spec) return null
	if (!spec.cli) {
		const result: CliStatus = { name: null, install: [] }
		if (spec.note !== undefined) result.note = spec.note
		return result
	}
	const path = which(spec.cli, env)
	// Built with sequential property assignment (rather than one literal) so the JSON key order
	// matches the original hand-written script exactly: name, installed, path, version,
	// authenticated, then login/tokenEnv/install/postInstall/docs.
	const cli = { name: spec.cli, installed: Boolean(path), path, version: null, authenticated: null } as CliStatus
	if (path) {
		const v = run(path, spec.version ?? [])
		cli.version = v.stdout.split('\n')[0] || null
		const hostArg = host.selfHosted ? (host.hostname ?? undefined) : undefined
		const a = run(path, spec.auth?.(hostArg) ?? [], { env: { ...env, GH_PROMPT_DISABLED: '1', NO_COLOR: '1' } })
		const loggedOut = spec.loggedOut?.test(`${a.stdout}\n${a.stderr}`)
		if (a.status === null) cli.authenticated = null
		else if (a.status === 0 && !loggedOut) cli.authenticated = true
		else cli.authenticated = spec.authReliable === false ? null : false
	}
	if (spec.login) cli.login = spec.login(host.selfHosted ? (host.hostname ?? undefined) : undefined)
	cli.tokenEnv = (spec.tokenEnv ?? []).filter((n) => env[n]).map((n) => `${n} is set`)
	cli.install = path ? [] : installOptions(spec, os, managers)
	cli.postInstall = spec.postInstall ?? []
	if (spec.docs !== undefined) cli.docs = spec.docs
	return cli
}
