import { type HostKind, hostKind, KINDS, PUBLIC, remoteHost } from '../git-host.js'
import type { HostEntry } from './clis.js'
import { run } from './os.js'

async function probe(hostname: string): Promise<HostKind | null> {
	const get = async (path: string): Promise<{ status: number; body: string }> => {
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

function usageError(message: string): never {
	process.stderr.write(`${message}\n`)
	process.stderr.write('usage: detect-env.mjs [--dir <repo>] [--host <kind[=hostname]>]... [--probe] [--json]\n')
	process.exit(2)
}

export async function collectHosts(dir: string, requested: string[], doProbe: boolean): Promise<HostEntry[]> {
	const byName = new Map<string, HostEntry>()
	const add = (hostname: string | null, kind: HostKind | null, remote?: string) => {
		const key = hostname ?? kind ?? ''
		const entry = byName.get(key) ?? { hostname, kind, remotes: [], selfHosted: hostname ? !PUBLIC[hostname] : false }
		if (!entry.kind && kind) entry.kind = kind
		if (remote && !entry.remotes.includes(remote)) entry.remotes.push(remote)
		byName.set(key, entry)
	}
	if (requested.length) {
		for (const spec of requested) {
			const [kind, hostname] = spec.split('=')
			if (!kind || !KINDS.includes(kind as HostKind)) usageError(`--host must be one of ${KINDS.join(', ')}`)
			add(hostname ?? Object.keys(PUBLIC).find((h) => PUBLIC[h] === kind) ?? null, kind as HostKind)
		}
	} else {
		const out = run('git', ['-C', dir, 'remote', '-v']).stdout
		for (const line of out.split('\n')) {
			const [name, url] = line.split(/\s+/)
			if (!url) continue
			const hostname = remoteHost(url)
			add(hostname, (hostname ? PUBLIC[hostname] : undefined) ?? hostKind(hostname), name)
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
