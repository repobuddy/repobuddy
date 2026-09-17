import { spawnSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import { arch, platform, release } from 'node:os'
import { delimiter, join } from 'node:path'

interface DistroInfo {
	id: string | null
	idLike: string | null
	version: string | null
	name: string | null
}

export type OsFamily =
	| 'macos'
	| 'windows'
	| 'debian'
	| 'fedora'
	| 'rhel'
	| 'suse'
	| 'arch'
	| 'alpine'
	| 'nixos'
	| 'other'

export interface OsInfo {
	platform: NodeJS.Platform
	arch: string
	release: string
	wsl: boolean
	family: OsFamily
	version?: string | null
	distro?: DistroInfo
	sudo?: 'root' | 'absent' | 'passwordless' | 'needs-password'
}

function readText(file: string): string {
	try {
		return readFileSync(file, 'utf8')
	} catch {
		return ''
	}
}

export interface RunResult {
	status: number | null
	stdout: string
	stderr: string
}

export function run(cmd: string, args: string[], opts: Record<string, unknown> = {}): RunResult {
	const r = spawnSync(cmd, args, { encoding: 'utf8', timeout: 10_000, stdio: ['ignore', 'pipe', 'pipe'], ...opts })
	return { status: r.error ? null : r.status, stdout: (r.stdout ?? '').trim(), stderr: (r.stderr ?? '').trim() }
}

export function which(
	name: string,
	env: NodeJS.ProcessEnv = process.env,
	plat: NodeJS.Platform = platform(),
): string | null {
	const exts = plat === 'win32' ? (env['PATHEXT'] ?? '.EXE;.CMD;.BAT').split(';') : ['']
	for (const dir of (env['PATH'] ?? env['Path'] ?? '').split(delimiter)) {
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

export function parseOsRelease(text: string): Record<string, string> {
	const out: Record<string, string> = {}
	for (const line of text.split('\n')) {
		const m = /^([A-Z_]+)=(.*)$/.exec(line.trim())
		if (m?.[1] !== undefined && m[2] !== undefined) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2')
	}
	return out
}

/** Collapse a distro ID and ID_LIKE into the family install recipes are written for. */
export function distroFamily(id = '', idLike = ''): OsFamily {
	const ids = [id, ...idLike.split(/\s+/)].map((s) => s.toLowerCase()).filter(Boolean)
	const has = (...names: string[]) => names.some((n) => ids.includes(n))
	if (has('alpine')) return 'alpine'
	if (has('arch', 'archlinux')) return 'arch'
	if (has('nixos')) return 'nixos'
	if (has('fedora') && !has('rhel', 'centos')) return 'fedora'
	if (has('rhel', 'centos', 'rocky', 'almalinux', 'ol', 'amzn')) return 'rhel'
	if (has('suse', 'opensuse', 'sles') || ids.some((i) => i.startsWith('opensuse'))) return 'suse'
	if (has('debian', 'ubuntu')) return 'debian'
	return 'other'
}

/** Injectable seams so tests can exercise every OS branch without touching the real machine. */
export interface DetectOsDeps {
	platform?: () => NodeJS.Platform
	arch?: () => string
	release?: () => string
	readText?: (file: string) => string
	run?: typeof run
	which?: typeof which
	getuid?: () => number
}

export function detectOs(env: NodeJS.ProcessEnv, deps: DetectOsDeps = {}): OsInfo {
	const platformFn = deps.platform ?? platform
	const archFn = deps.arch ?? arch
	const releaseFn = deps.release ?? release
	const readTextFn = deps.readText ?? readText
	const runFn = deps.run ?? run
	const whichFn = deps.which ?? which
	const getuidFn = deps.getuid ?? (typeof process.getuid === 'function' ? process.getuid.bind(process) : undefined)
	const plat = platformFn()
	// `family` is assigned per-branch below (after `distro` for linux) rather than in this literal,
	// so the JSON key order matches the original script: platform, arch, release, wsl, distro, family.
	const os = { platform: plat, arch: archFn(), release: releaseFn(), wsl: false } as OsInfo
	if (plat === 'darwin') {
		os.family = 'macos'
		os.version = runFn('sw_vers', ['-productVersion']).stdout || null
	} else if (plat === 'win32') {
		os.family = 'windows'
	} else if (plat === 'linux') {
		os.wsl = Boolean(env['WSL_DISTRO_NAME']) || /microsoft/i.test(readTextFn('/proc/version'))
		const rel = parseOsRelease(readTextFn('/etc/os-release'))
		os.distro = {
			id: rel['ID'] ?? null,
			idLike: rel['ID_LIKE'] ?? null,
			version: rel['VERSION_ID'] ?? null,
			name: rel['PRETTY_NAME'] ?? null,
		}
		os.family = distroFamily(rel['ID'], rel['ID_LIKE'])
	} else {
		os.family = 'other'
	}
	if (plat !== 'win32') {
		if (getuidFn && getuidFn() === 0) os.sudo = 'root'
		else if (!whichFn('sudo', env)) os.sudo = 'absent'
		else os.sudo = runFn('sudo', ['-n', 'true']).status === 0 ? 'passwordless' : 'needs-password'
	}
	return os
}
