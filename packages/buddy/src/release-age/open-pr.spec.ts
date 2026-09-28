import assert from 'node:assert/strict'
import { test } from '@jest/globals'
import { openPr } from './open-pr.js'

function fakeFetch(routes: [string, RegExp, unknown][]) {
	const calls: { method: string; url: string; body: unknown; auth: unknown }[] = []
	const fn = async (url: string | URL | Request, init: RequestInit = {}) => {
		const method = init.method ?? 'GET'
		const headers = init.headers as Record<string, string>
		calls.push({
			method,
			url: String(url),
			body: init.body ? JSON.parse(String(init.body)) : undefined,
			auth: headers?.['authorization'],
		})
		const hit = routes.find(([m, re]) => m === method && re.test(String(url)))
		const json = hit ? hit[2] : null
		return {
			ok: Boolean(hit),
			status: hit ? 200 : 404,
			text: async () => JSON.stringify(json ?? { error: 'nope' }),
		} as Response
	}
	return { fn: fn as unknown as typeof fetch, calls }
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
	const secondCall = f.calls[1] as { body: { destination: { branch: { name: string } } }; auth: string }
	assert.equal(secondCall.body.destination.branch.name, 'main')
	assert.equal(secondCall.auth, 'Bearer t')
	assert.match(
		decodeURIComponent(f.calls[0]?.url ?? ''),
		/source.branch.name="chore\/min-release-age-restore" AND state="OPEN"/,
	)
	f = fakeFetch([
		['GET', /\?q=/, { values: [{ id: 7 }] }],
		['PUT', /pullrequests\/7$/, { links: { html: { href: 'u7' } } }],
	])
	const updated = await openPr('bitbucket', args, env, f.fn)
	assert.equal(updated.ok && updated.action, 'updated')
	assert.equal((await openPr('bitbucket', args, {}, f.fn)).ok, false)
})

test('open-pr: a non-Error throw is stringified', async () => {
	const badFetch = (async () => {
		throw 'boom'
	}) as unknown as typeof fetch
	const r = await openPr(
		'bitbucket',
		args,
		{ BITBUCKET_WORKSPACE: 'w', BITBUCKET_REPO_SLUG: 'r', BITBUCKET_BRANCH: 'main', MIN_RELEASE_AGE_TOKEN: 't' },
		badFetch,
	)
	assert.equal(r.ok, false)
	assert.ok(!r.ok && r.error === 'boom')
})

test('open-pr: an empty response body parses as {}, and a failed non-GET call reports its method', async () => {
	const patched = async (_url: string | URL | Request, init?: RequestInit) => {
		if ((init?.method ?? 'GET') === 'POST') return { ok: false, status: 500, text: async () => '' } as Response
		return { ok: true, status: 200, text: async () => '' } as Response
	}
	const env = {
		BITBUCKET_WORKSPACE: 'w',
		BITBUCKET_REPO_SLUG: 'r',
		BITBUCKET_BRANCH: 'main',
		MIN_RELEASE_AGE_TOKEN: 't',
	}
	const r = await openPr('bitbucket', args, env, patched as typeof fetch)
	assert.equal(r.ok, false)
	assert.ok(!r.ok && /^POST .* → 500/.test(r.error))
})

test('open-pr: default env/fetch parameters are used when omitted (fails fast on missing env, no network)', async () => {
	const savedEnv = { ...process.env }
	for (const k of ['BITBUCKET_WORKSPACE', 'BITBUCKET_REPO_SLUG', 'BITBUCKET_BRANCH', 'MIN_RELEASE_AGE_TOKEN']) {
		delete process.env[k]
	}
	try {
		const r = await openPr('bitbucket', args)
		assert.equal(r.ok, false)
	} finally {
		process.env = savedEnv
	}
})

test('open-pr forgejo: missing both token env vars is a failure', async () => {
	const env = { GITHUB_SERVER_URL: 'https://codeberg.org', GITHUB_REPOSITORY: 'a/b', GITHUB_REF_NAME: 'main' }
	const r = await openPr('forgejo', args, env, fakeFetch([]).fn)
	assert.equal(r.ok, false)
	assert.ok(!r.ok && /MIN_RELEASE_AGE_TOKEN or GITHUB_TOKEN/.test(r.error))
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
	assert.match(
		f.calls[1]?.url ?? '',
		/^https:\/\/dev\.azure\.com\/o\/My%20Proj\/_apis\/git\/repositories\/id\/pullrequests/,
	)
	const body = (f.calls[1]?.body ?? {}) as { sourceRefName: string; targetRefName: string }
	assert.deepEqual(
		[body.sourceRefName, body.targetRefName],
		['refs/heads/chore/min-release-age-restore', 'refs/heads/main'],
	)
})

test('open-pr azure: updates an existing PR when one is already open', async () => {
	const env = {
		SYSTEM_COLLECTIONURI: 'https://dev.azure.com/o/',
		SYSTEM_TEAMPROJECT: 'My Proj',
		BUILD_REPOSITORY_ID: 'id',
		BUILD_SOURCEBRANCH: 'refs/heads/main',
		SYSTEM_ACCESSTOKEN: 't',
	}
	const f = fakeFetch([
		['GET', /searchCriteria/, { value: [{ pullRequestId: 9 }] }],
		['PATCH', /pullrequests\/9\?api-version=7.1$/, {}],
	])
	assert.deepEqual(await openPr('azure', args, env, f.fn), { ok: true, provider: 'azure', action: 'updated', id: 9 })
})

test('open-pr forgejo: creates a new PR when none is open', async () => {
	const env = {
		GITHUB_SERVER_URL: 'https://codeberg.org',
		GITHUB_REPOSITORY: 'a/b',
		GITHUB_REF_NAME: 'main',
		MIN_RELEASE_AGE_TOKEN: 'g',
	}
	const f = fakeFetch([
		['GET', /pulls\?state=open/, []],
		['POST', /\/pulls$/, { html_url: 'created-url' }],
	])
	assert.deepEqual(await openPr('forgejo', args, env, f.fn), {
		ok: true,
		provider: 'forgejo',
		action: 'created',
		url: 'created-url',
	})
	assert.equal(f.calls[0]?.auth, 'token g')
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
	assert.equal(f.calls[0]?.auth, 'token g')
	f = fakeFetch([['GET', /pulls\?state=open/, []]])
	const r = await openPr('forgejo', args, env, f.fn)
	assert.equal(r.ok, false)
	assert.ok(!r.ok && /POST .* → 404/.test(r.error))
	assert.equal((await openPr('github', args, env, f.fn)).ok, false)
})
