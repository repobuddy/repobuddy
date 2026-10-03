import {
	credentialFields,
	nonSecretArgs,
} from '../../../../packages/buddy-agent-harness/src/diagnose-mcp/mcp-secrets.ts'

const reported = (env: Record<string, string>) => credentialFields({ name: 'bench', env } as never)

const failures = [
	reported({ GITHUB_PAT: 'ghp_literal' }).length === 1 || 'GITHUB_PAT is not reported',
	reported({ githubPat: 'ghp_literal' }).length === 1 || 'githubPat is not reported',
	reported({ GITHUB_PAT: '$GITHUB_PAT' }).length === 0 || 'a referenced GITHUB_PAT is reported',
	reported({ MY_PATH: '/usr/bin' }).length === 0 || 'MY_PATH is reported',
	reported({ PATTERN: 'x' }).length === 0 || 'PATTERN is reported',
	nonSecretArgs(['--pat=ghp_literal']).length === 0 || '--pat=<literal> is kept in args',
].filter((result) => result !== true)

if (failures.length) {
	console.error(failures.join('\n'))
	process.exit(1)
}
