import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { hostKind, remoteHost } from '../git-host.js'

interface ProviderInfo {
	name: string
	detect: string[]
	job: string
	script: string
	image?: string
}

// ── CI providers ──────────────────────────────────────────────────────────────
// detect: files that show the CI system is in use. job: where setup-ci writes the cleanup job.
// script: where setup-ci copies this script by default. image: the job's default runner image, for
// templates that set one the user may override. `job` ending in `#` means "a block inside that file".
const PROVIDERS: Record<string, ProviderInfo> = {
	github: {
		name: 'GitHub Actions',
		detect: ['.github/workflows'],
		job: '.github/workflows/min-release-age.yml',
		script: '.github/scripts/min-release-age.mjs',
	},
	gitlab: {
		name: 'GitLab CI',
		detect: ['.gitlab-ci.yml'],
		job: '.gitlab/ci/min-release-age.yml',
		script: 'ci/min-release-age.mjs',
		image: 'node:22',
	},
	bitbucket: {
		name: 'Bitbucket Pipelines',
		detect: ['bitbucket-pipelines.yml'],
		job: 'bitbucket-pipelines.yml#',
		script: 'ci/min-release-age.mjs',
	},
	azure: {
		name: 'Azure Pipelines',
		detect: ['azure-pipelines.yml', '.azure-pipelines'],
		job: '.azure-pipelines/min-release-age.yml',
		script: 'ci/min-release-age.mjs',
	},
	forgejo: {
		name: 'Forgejo Actions',
		detect: ['.forgejo/workflows'],
		job: '.forgejo/workflows/min-release-age.yml',
		script: '.forgejo/scripts/min-release-age.mjs',
	},
	gitea: {
		name: 'Gitea Actions',
		detect: ['.gitea/workflows'],
		job: '.gitea/workflows/min-release-age.yml',
		script: '.gitea/scripts/min-release-age.mjs',
	},
}

// CI systems without a template: setup-ci falls back to the generic reference.
const OTHER_CI: Record<string, string> = {
	circleci: '.circleci/config.yml',
	jenkins: 'Jenkinsfile',
	travis: '.travis.yml',
	woodpecker: '.woodpecker',
	drone: '.drone.yml',
	buildkite: '.buildkite',
}

function hasJob(dir: string, provider: string): boolean {
	const info = PROVIDERS[provider]
	if (!info) return false
	const { job } = info
	if (!job.endsWith('#')) return existsSync(join(dir, job))
	const file = join(dir, job.slice(0, -1))
	return existsSync(file) && readFileSync(file, 'utf8').includes('min-release-age')
}

// What an installed job actually uses, so a moved script or a custom image survives a setup-ci re-run.
function readJob(dir: string, job: string): { script?: string | undefined; image?: string | undefined } {
	const file = join(dir, job)
	if (!existsSync(file)) return {}
	const text = readFileSync(file, 'utf8')
	const script = /(?:^|[\s'"=:])((?:[\w.@${}-]+\/)*min-release-age\.mjs)\b/m.exec(text)?.[1]
	const image = /^\s*image:\s*(?:name:\s*)?['"]?([^\s'"#]+)/m.exec(text)?.[1]
	return { script, image }
}

export interface CiInfo {
	remote: string | null
	host: string
	systems: string[]
	provider: string
	templated: boolean
	installed: boolean
	job: string | null
	script: string
	image: string | null
	reference: string
}

export function detectCi(dir: string, remote?: string): CiInfo {
	let url = remote
	if (url === undefined) {
		try {
			url = execFileSync('git', ['-C', dir, 'remote', 'get-url', 'origin'], {
				encoding: 'utf8',
				stdio: ['ignore', 'pipe', 'ignore'],
			}).trim()
		} catch {
			url = undefined
		}
	}
	const hostname = remoteHost(url)
	const host = hostKind(hostname) ?? 'unknown'
	const systems = [
		...Object.keys(PROVIDERS).filter((p) => PROVIDERS[p]?.detect.some((f) => existsSync(join(dir, f)))),
		...Object.keys(OTHER_CI).filter((p) => existsSync(join(dir, OTHER_CI[p] ?? ''))),
	]
	// Forgejo and Gitea also run `.github/workflows`; those workflows still need the host's API.
	if (['forgejo', 'gitea'].includes(host) && systems.includes('github') && !systems.includes(host)) {
		systems.splice(systems.indexOf('github'), 1, host)
	}
	const installed = Object.keys(PROVIDERS).find((p) => hasJob(dir, p)) ?? null
	const provider =
		installed ?? (systems.includes(host) ? host : undefined) ?? systems[0] ?? (PROVIDERS[host] ? host : 'other')
	const providerInfo = PROVIDERS[provider]
	const job = providerInfo?.job.replace(/#$/, '') ?? null
	const actual = installed && job ? readJob(dir, job) : {}
	return {
		remote: url ?? null,
		host,
		systems,
		provider,
		templated: Boolean(providerInfo),
		installed: Boolean(installed),
		job,
		script: actual.script ?? providerInfo?.script ?? 'ci/min-release-age.mjs',
		image: providerInfo?.image ? (actual.image ?? providerInfo.image) : null,
		reference: `references/ci/${provider === 'gitea' ? 'forgejo' : providerInfo ? provider : 'other'}.md`,
	}
}
