// Opens, or updates, the restore pull request from inside a CI job. GitHub uses `gh` and GitLab uses
// push options, so only the providers without a preinstalled CLI are handled here.

const RESTORE_TITLE = 'chore: restore minimum release age'

type FetchFn = typeof fetch

function required(env: Record<string, string | undefined>, names: string[]): string[] {
	const missing = names.filter((n) => !env[n])
	if (missing.length) throw new Error(`missing environment variable(s): ${missing.join(', ')}`)
	return names.map((n) => env[n] as string)
}

async function call(fetchFn: FetchFn, url: string, init?: RequestInit): Promise<unknown> {
	const res = await fetchFn(url, {
		...init,
		headers: { 'content-type': 'application/json', accept: 'application/json', ...init?.headers },
	})
	const text = await res.text()
	if (!res.ok) throw new Error(`${init?.method ?? 'GET'} ${url} → ${res.status} ${text.slice(0, 300)}`)
	return text ? JSON.parse(text) : {}
}

export interface OpenPrArgs {
	branch: string
	body: string
}

type PrOutcome = { action: 'created' | 'updated'; url?: string | undefined; id?: number | undefined }

type PrApi = (env: Record<string, string | undefined>, args: OpenPrArgs, fetchFn: FetchFn) => Promise<PrOutcome>

const PR_APIS: Record<string, PrApi> = {
	bitbucket: async (env, { branch, body }, fetchFn) => {
		const [workspace, slug, base, token] = required(env, [
			'BITBUCKET_WORKSPACE',
			'BITBUCKET_REPO_SLUG',
			'BITBUCKET_BRANCH',
			'MIN_RELEASE_AGE_TOKEN',
		]) as [string, string, string, string]
		const api = `https://api.bitbucket.org/2.0/repositories/${workspace}/${slug}/pullrequests`
		const headers = { authorization: `Bearer ${token}` }
		const q = encodeURIComponent(`source.branch.name="${branch}" AND state="OPEN"`)
		const list = (await call(fetchFn, `${api}?q=${q}`, { headers })) as { values?: { id: number }[] }
		const [open] = list.values ?? []
		if (open) {
			const pr = (await call(fetchFn, `${api}/${open.id}`, {
				method: 'PUT',
				headers,
				body: JSON.stringify({ title: RESTORE_TITLE, description: body }),
			})) as { links?: { html?: { href?: string } } }
			return { action: 'updated', url: pr.links?.html?.href }
		}
		const pr = (await call(fetchFn, api, {
			method: 'POST',
			headers,
			body: JSON.stringify({
				title: RESTORE_TITLE,
				description: body,
				source: { branch: { name: branch } },
				destination: { branch: { name: base } },
				close_source_branch: true,
			}),
		})) as { links?: { html?: { href?: string } } }
		return { action: 'created', url: pr.links?.html?.href }
	},
	azure: async (env, { branch, body }, fetchFn) => {
		const [collection, project, repo, base, token] = required(env, [
			'SYSTEM_COLLECTIONURI',
			'SYSTEM_TEAMPROJECT',
			'BUILD_REPOSITORY_ID',
			'BUILD_SOURCEBRANCH',
			'SYSTEM_ACCESSTOKEN',
		]) as [string, string, string, string, string]
		const api = `${collection.replace(/\/$/, '')}/${encodeURIComponent(project)}/_apis/git/repositories/${repo}/pullrequests`
		const headers = { authorization: `Bearer ${token}` }
		const source = `refs/heads/${branch}`
		const search = `searchCriteria.sourceRefName=${encodeURIComponent(source)}&searchCriteria.status=active`
		const list = (await call(fetchFn, `${api}?${search}&api-version=7.1`, { headers })) as {
			value?: { pullRequestId: number }[]
		}
		const [open] = list.value ?? []
		if (open) {
			await call(fetchFn, `${api}/${open.pullRequestId}?api-version=7.1`, {
				method: 'PATCH',
				headers,
				body: JSON.stringify({ description: body }),
			})
			return { action: 'updated', id: open.pullRequestId }
		}
		const pr = (await call(fetchFn, `${api}?api-version=7.1`, {
			method: 'POST',
			headers,
			body: JSON.stringify({ sourceRefName: source, targetRefName: base, title: RESTORE_TITLE, description: body }),
		})) as { pullRequestId: number }
		return { action: 'created', id: pr.pullRequestId }
	},
	forgejo: async (env, { branch, body }, fetchFn) => {
		const [server, repo, base] = required(env, ['GITHUB_SERVER_URL', 'GITHUB_REPOSITORY', 'GITHUB_REF_NAME']) as [
			string,
			string,
			string,
		]
		const token = env['MIN_RELEASE_AGE_TOKEN'] || env['GITHUB_TOKEN']
		if (!token) throw new Error('missing environment variable(s): MIN_RELEASE_AGE_TOKEN or GITHUB_TOKEN')
		const api = `${server.replace(/\/$/, '')}/api/v1/repos/${repo}/pulls`
		const headers = { authorization: `token ${token}` }
		const pulls = (await call(fetchFn, `${api}?state=open&limit=50`, { headers })) as {
			head?: { ref?: string }
			number: number
		}[]
		const open = pulls.find((p) => p.head?.ref === branch)
		if (open) {
			const pr = (await call(fetchFn, `${api}/${open.number}`, {
				method: 'PATCH',
				headers,
				body: JSON.stringify({ body }),
			})) as { html_url?: string }
			return { action: 'updated', url: pr.html_url }
		}
		const pr = (await call(fetchFn, api, {
			method: 'POST',
			headers,
			body: JSON.stringify({ head: branch, base, title: RESTORE_TITLE, body }),
		})) as { html_url?: string }
		return { action: 'created', url: pr.html_url }
	},
}
PR_APIS['gitea'] = PR_APIS['forgejo'] as PrApi

export type OpenPrResult =
	| ({ ok: true; provider: string } & PrOutcome)
	| { ok: false; error: string; provider?: string }

export async function openPr(
	provider: string,
	args: OpenPrArgs,
	env: Record<string, string | undefined> = process.env,
	fetchFn: FetchFn = fetch,
): Promise<OpenPrResult> {
	const api = PR_APIS[provider]
	if (!api) return { ok: false, error: `open-pr supports ${Object.keys(PR_APIS).join(', ')}; got "${provider}"` }
	try {
		return { ok: true, provider, ...(await api(env, args, fetchFn)) }
	} catch (error) {
		return { ok: false, provider, error: error instanceof Error ? error.message : String(error) }
	}
}
