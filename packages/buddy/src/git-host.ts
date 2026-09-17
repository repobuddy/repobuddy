// Shared git-host classification, used by both the min-release-age and init-buddy skills.

export type HostKind = 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'forgejo' | 'gitea'

export const KINDS: HostKind[] = ['github', 'gitlab', 'bitbucket', 'azure', 'gitea', 'forgejo']

// init-buddy's table is a superset of min-release-age's: it adds a trailing `/github/` fallback that
// classifies a bare hostname like `github.acme.com` as `github`. Sharing this table is the one
// intentional behavior change for min-release-age (see AGENTS.md task notes).
const HOSTS: [RegExp, HostKind][] = [
	[/(^|\.)github\.com$/, 'github'],
	[/(^|\.)bitbucket\.org$/, 'bitbucket'],
	[/(^|\.)(dev\.azure\.com|visualstudio\.com)$/, 'azure'],
	[/(^|\.)codeberg\.org$|forgejo/, 'forgejo'],
	[/gitea/, 'gitea'],
	[/(^|\.)gitlab\.com$|gitlab/, 'gitlab'],
	[/github/, 'github'],
]

/** The public hostname for each host kind. */
export const PUBLIC: Record<string, HostKind> = {
	'github.com': 'github',
	'gitlab.com': 'gitlab',
	'bitbucket.org': 'bitbucket',
	'dev.azure.com': 'azure',
	'gitea.com': 'gitea',
	'codeberg.org': 'forgejo',
}

export function remoteHost(url: string | undefined): string | null {
	const m = /^(?:[a-z+]+:\/\/)?(?:[^@/]+@)?([^/:]+)/i.exec(url ?? '')
	return m?.[1]?.toLowerCase() ?? null
}

export function hostKind(hostname: string | null | undefined): HostKind | null {
	if (!hostname) return null
	return HOSTS.find(([re]) => re.test(hostname))?.[1] ?? null
}
