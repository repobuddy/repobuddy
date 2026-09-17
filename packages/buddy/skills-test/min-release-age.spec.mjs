import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from '@jest/globals'
import {
	detectCi,
	lift,
	openPr,
	resolveSpec,
	restore,
	status,
} from '../skills/min-release-age/scripts/min-release-age.mjs'

const now = new Date('2026-09-16T10:00:00Z')
const until = '2026-09-17T10:00:00Z'
const later = new Date('2026-09-18T00:00:00Z')

function repo(file, text) {
	const dir = mkdtempSync(join(tmpdir(), 'mra-'))
	writeFileSync(join(dir, file), text)
	return dir
}

test('pnpm: lift appends to existing list, restore removes only the lift', () => {
	const src = `minimumReleaseAge: 1440\nminimumReleaseAgeExclude:\n  - assertron\n  - '@repobuddy/*'\n\nother: 1\n`
	const dir = repo('pnpm-workspace.yaml', src)
	const r = lift(dir, 'pnpm', 'left-pad@1.3.0', { until, now })
	assert.equal(r.changed, true)
	const text = readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8')
	assert.match(
		text,
		/ {2}- '@repobuddy\/\*'\n {2}# min-release-age: lift left-pad@1.3.0 until 2026-09-17T10:00:00Z\n {2}- 'left-pad@1.3.0'\n\nother: 1/,
	)
	const s = status(dir, 'pnpm', later)
	assert.equal(s.minutes, 1440)
	assert.deepEqual(s.permanent, ['assertron', '@repobuddy/*'])
	assert.equal(s.lifts[0].expired, true)
	assert.equal(restore(dir, 'pnpm', { now }).removed.length, 0)
	assert.equal(restore(dir, 'pnpm', { now: later }).removed.length, 1)
	assert.equal(readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8'), src)
})

test('pnpm: glob and existing entries count as covered', () => {
	const dir = repo('pnpm-workspace.yaml', `minimumReleaseAgeExclude:\n  - '@repobuddy/*'\n`)
	assert.equal(lift(dir, 'pnpm', '@repobuddy/jest@1.0.0', { until, now }).changed, false)
})

test('pnpm: missing key is created; empty list after restore becomes []', () => {
	const dir = repo('pnpm-workspace.yaml', 'packages:\n  - packages/*\n')
	lift(dir, 'pnpm', '@scope/pkg@2.0.0', { until, now })
	assert.equal(status(dir, 'pnpm', now).lifts[0].value, '@scope/pkg@2.0.0')
	restore(dir, 'pnpm', { now: later })
	assert.equal(
		readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8'),
		'packages:\n  - packages/*\n\nminimumReleaseAgeExclude: []\n',
	)
})

test('yarn: flow list converted to block', () => {
	const dir = repo('.yarnrc.yml', `npmMinimalAgeGate: 3d\nnpmPreapprovedPackages: [foo, "@a/*"]\n`)
	lift(dir, 'yarn', 'bar@1.0.0', { until, now })
	const s = status(dir, 'yarn', now)
	assert.equal(s.minutes, 4320)
	assert.deepEqual(s.permanent, ['foo', '@a/*'])
	assert.equal(s.lifts[0].value, 'bar@1.0.0')
})

test('npm: refuses without --name-wide, then exempts the name', () => {
	const dir = repo('.npmrc', 'min-release-age=2\nmin-release-age-exclude=foo\n')
	assert.equal(lift(dir, 'npm', 'bar@1.0.0', { until, now }).ok, false)
	assert.equal(lift(dir, 'npm', 'bar@1.0.0', { until, now, nameWide: true }).changed, true)
	const text = readFileSync(join(dir, '.npmrc'), 'utf8')
	assert.equal(
		text,
		`min-release-age=2\nmin-release-age-exclude[]=foo\n# min-release-age: lift bar@1.0.0 until ${until}\nmin-release-age-exclude[]=bar\n`,
	)
	assert.equal(status(dir, 'npm', now).minutes, 2880)
	restore(dir, 'npm', { now: later })
	assert.deepEqual(status(dir, 'npm', now).lifts, [])
})

test('bun: inline array rewritten, multi-line array gets trailing comma', () => {
	const dir = repo('bunfig.toml', `[install]\nminimumReleaseAge = 86400\nminimumReleaseAgeExcludes = ["foo"]\n`)
	lift(dir, 'bun', 'bar@1.0.0', { until, now, nameWide: true })
	lift(dir, 'bun', 'baz@1.0.0', { until: '2026-09-20T00:00:00Z', now, nameWide: true })
	const s = status(dir, 'bun', later)
	assert.equal(s.minutes, 1440)
	assert.deepEqual(s.permanent, ['foo'])
	assert.deepEqual(
		s.lifts.map((l) => [l.value, l.expired]),
		[
			['bar', true],
			['baz', false],
		],
	)
	restore(dir, 'bun', { now: later })
	assert.equal(
		readFileSync(join(dir, 'bunfig.toml'), 'utf8'),
		`[install]\nminimumReleaseAge = 86400\nminimumReleaseAgeExcludes = [\n  "foo",\n  # min-release-age: lift baz@1.0.0 until 2026-09-20T00:00:00Z\n  "baz",\n]\n`,
	)
	const dir2 = repo('bunfig.toml', `[install]\nminimumReleaseAgeExcludes = [\n  "foo"\n]\n`)
	lift(dir2, 'bun', 'bar@1.0.0', { until, now, nameWide: true })
	assert.match(readFileSync(join(dir2, 'bunfig.toml'), 'utf8'), /"foo",\n {2}# min/)
})

test('restore fails on an orphaned marker', () => {
	const dir = repo(
		'pnpm-workspace.yaml',
		`minimumReleaseAgeExclude:\n  # min-release-age: lift a@1.0.0 until 2026-01-01T00:00:00Z\n  - 'b@1.0.0'\n`,
	)
	assert.equal(restore(dir, 'pnpm', { now }).ok, false)
})

test('lift rejects ranges and already-aged versions', () => {
	const dir = repo('pnpm-workspace.yaml', 'minimumReleaseAge: 1440\n')
	assert.equal(lift(dir, 'pnpm', 'a@^1.0.0', { until, now }).ok, false)
	assert.equal(lift(dir, 'pnpm', 'a@1.0.0', { until: '2026-01-01T00:00:00Z', now }).changed, false)
})

const fake = {
	distTags: (name) => ({ '@s/p': { latest: '2.1.0', next: '3.0.0-beta.1' }, x: { latest: '1.0.0' } })[name] ?? {},
	times: () => ({ '2.1.0': '2026-09-16T08:30:00Z', '3.0.0-beta.1': '2026-09-15T00:00:00Z' }),
}

test('resolveSpec: bare name, scoped name, tag, exact, range', () => {
	assert.deepEqual(resolveSpec('@s/p', fake), { name: '@s/p', version: '2.1.0', tag: 'latest' })
	assert.deepEqual(resolveSpec('@s/p@next', fake), { name: '@s/p', version: '3.0.0-beta.1', tag: 'next' })
	assert.deepEqual(resolveSpec('@s/p@1.2.3-rc.1', fake), { name: '@s/p', version: '1.2.3-rc.1' })
	assert.match(resolveSpec('@s/p@^1.0.0', fake).error, /range/)
	assert.match(resolveSpec('x@beta', fake).error, /no "beta" dist-tag/)
})

test('lift without a version pins latest and computes expiry from publish time', () => {
	const dir = repo('pnpm-workspace.yaml', 'minimumReleaseAge: 1440\n')
	const r = lift(dir, 'pnpm', '@s/p', { now, registry: fake })
	assert.equal(r.spec, '@s/p@2.1.0')
	assert.equal(r.tag, 'latest')
	assert.equal(r.until, '2026-09-17T09:00:00Z')
	assert.equal(status(dir, 'pnpm', now).lifts[0].value, '@s/p@2.1.0')
})

function ciRepo(files) {
	const dir = mkdtempSync(join(tmpdir(), 'mra-ci-'))
	for (const [f, text] of Object.entries(files)) {
		mkdirSync(join(dir, f, '..'), { recursive: true })
		if (f.endsWith('/')) mkdirSync(join(dir, f), { recursive: true })
		else writeFileSync(join(dir, f), text)
	}
	return dir
}

test('detectCi: hosts from remote URLs', () => {
	const empty = ciRepo({})
	const host = (u) => detectCi(empty, u).host
	assert.equal(host('git@github.com:a/b.git'), 'github')
	assert.equal(host('https://gitlab.example.com/a/b.git'), 'gitlab')
	assert.equal(host('ssh://git@gitlab.com:2222/a/b.git'), 'gitlab')
	assert.equal(host('git@bitbucket.org:a/b.git'), 'bitbucket')
	assert.equal(host('https://org@dev.azure.com/org/p/_git/r'), 'azure')
	assert.equal(host('https://codeberg.org/a/b'), 'forgejo')
	assert.equal(host('https://git.example.com/a/b'), 'unknown')
	assert.equal(detectCi(empty, 'git@gitlab.com:a/b.git').provider, 'gitlab')
	assert.equal(detectCi(empty, 'https://git.example.com/a/b').provider, 'other')
	assert.equal(detectCi(empty, '').host, 'unknown')
})

test('detectCi: CI files beat the host; installed job wins', () => {
	const gh = 'git@github.com:a/b.git'
	assert.equal(detectCi(ciRepo({ '.circleci/config.yml': 'x' }), gh).provider, 'circleci')
	assert.equal(detectCi(ciRepo({ '.circleci/config.yml': 'x' }), gh).templated, false)
	assert.equal(detectCi(ciRepo({ '.circleci/config.yml': 'x', '.github/workflows/': '' }), gh).provider, 'github')
	const self = ciRepo({ '.gitlab-ci.yml': 'x' })
	assert.deepEqual(
		[detectCi(self, 'https://git.corp/a/b').provider, detectCi(self, 'https://git.corp/a/b').job],
		['gitlab', '.gitlab/ci/min-release-age.yml'],
	)
	const bb = detectCi(ciRepo({ 'bitbucket-pipelines.yml': 'custom:\n  min-release-age:\n' }), gh)
	assert.deepEqual([bb.provider, bb.installed, bb.job], ['bitbucket', true, 'bitbucket-pipelines.yml'])
})

function fakeFetch(routes) {
	const calls = []
	const fn = async (url, init = {}) => {
		const method = init.method ?? 'GET'
		calls.push({ method, url, body: init.body && JSON.parse(init.body), auth: init.headers.authorization })
		const hit = routes.find(([m, re]) => m === method && re.test(url))
		const json = hit ? hit[2] : null
		return { ok: Boolean(hit), status: hit ? 200 : 404, text: async () => JSON.stringify(json ?? { error: 'nope' }) }
	}
	return { fn, calls }
}
const args = { branch: 'chore/min-release-age-restore', body: 'b' }

test('open-pr bitbucket: create, then update', async () => {
	const env = {
		BITBUCKET_WORKSPACE: 'w',
		BITBUCKET_REPO_SLUG: 'r',
		BITBUCKET_BRANCH: 'main',
		MIN_RELEASE_AGE_TOKEN: 't',
	}
	let f = fakeFetch([
		['GET', /\?q=/, { values: [] }],
		['POST', /pullrequests$/, { links: { html: { href: 'u' } } }],
	])
	assert.deepEqual(await openPr('bitbucket', args, env, f.fn), {
		ok: true,
		provider: 'bitbucket',
		action: 'created',
		url: 'u',
	})
	assert.equal(f.calls[1].body.destination.branch.name, 'main')
	assert.equal(f.calls[1].auth, 'Bearer t')
	assert.match(
		decodeURIComponent(f.calls[0].url),
		/source.branch.name="chore\/min-release-age-restore" AND state="OPEN"/,
	)
	f = fakeFetch([
		['GET', /\?q=/, { values: [{ id: 7 }] }],
		['PUT', /pullrequests\/7$/, { links: { html: { href: 'u7' } } }],
	])
	assert.equal((await openPr('bitbucket', args, env, f.fn)).action, 'updated')
	assert.equal((await openPr('bitbucket', args, {}, f.fn)).ok, false)
})

test('open-pr azure: create against the source branch', async () => {
	const env = {
		SYSTEM_COLLECTIONURI: 'https://dev.azure.com/o/',
		SYSTEM_TEAMPROJECT: 'My Proj',
		BUILD_REPOSITORY_ID: 'id',
		BUILD_SOURCEBRANCH: 'refs/heads/main',
		SYSTEM_ACCESSTOKEN: 't',
	}
	const f = fakeFetch([
		['GET', /searchCriteria/, { value: [] }],
		['POST', /pullrequests\?api-version=7.1$/, { pullRequestId: 3 }],
	])
	assert.deepEqual(await openPr('azure', args, env, f.fn), { ok: true, provider: 'azure', action: 'created', id: 3 })
	assert.match(f.calls[1].url, /^https:\/\/dev.azure.com\/o\/My%20Proj\/_apis\/git\/repositories\/id\/pullrequests/)
	assert.deepEqual(
		[f.calls[1].body.sourceRefName, f.calls[1].body.targetRefName],
		['refs/heads/chore/min-release-age-restore', 'refs/heads/main'],
	)
})

test('open-pr forgejo/gitea: update matches head ref; error surfaces status', async () => {
	const env = {
		GITHUB_SERVER_URL: 'https://codeberg.org',
		GITHUB_REPOSITORY: 'a/b',
		GITHUB_REF_NAME: 'main',
		GITHUB_TOKEN: 'g',
	}
	let f = fakeFetch([
		[
			'GET',
			/pulls\?state=open/,
			[
				{ number: 1, head: { ref: 'other' } },
				{ number: 2, head: { ref: args.branch } },
			],
		],
		['PATCH', /pulls\/2$/, { html_url: 'h' }],
	])
	assert.deepEqual(await openPr('gitea', args, env, f.fn), { ok: true, provider: 'gitea', action: 'updated', url: 'h' })
	assert.equal(f.calls[0].auth, 'token g')
	f = fakeFetch([['GET', /pulls\?state=open/, []]])
	const r = await openPr('forgejo', args, env, f.fn)
	assert.equal(r.ok, false)
	assert.match(r.error, /POST .* → 404/)
	assert.equal((await openPr('github', args, env, f.fn)).ok, false)
})

test('detectCi: reference per provider', () => {
	const r = (files, url) => detectCi(ciRepo(files), url).reference
	assert.equal(r({}, 'git@github.com:a/b'), 'references/ci/github.md')
	assert.equal(r({ '.gitea/workflows/': '' }, 'https://git.x/a/b'), 'references/ci/forgejo.md')
	assert.equal(r({ Jenkinsfile: 'x' }, 'git@github.com:a/b'), 'references/ci/other.md')
})

test('detectCi: .github/workflows on a Forgejo host targets forgejo', () => {
	const d = detectCi(ciRepo({ '.github/workflows/': '' }), 'https://codeberg.org/a/b')
	assert.deepEqual([d.provider, d.systems, d.reference], ['forgejo', ['forgejo'], 'references/ci/forgejo.md'])
})
