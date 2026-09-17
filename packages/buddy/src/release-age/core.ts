import { execFileSync } from 'node:child_process'
import { detectCi } from './ci.js'
import { insertEntry, load, MARKER, readAge, readExemptions, save, toMinutes, yamlBlock } from './config-file.js'
import { MANAGERS, type PackageManager } from './managers.js'

// ── status ────────────────────────────────────────────────────────────────────

interface LiftExemption {
	value: string
	line: number
	until: string | null
	kind: 'lift' | 'permanent'
	expired: boolean
}

export interface StatusResult {
	packageManager: PackageManager
	file: string
	setting: string
	value: string | null
	unit: string
	minutes: number | null
	defaultApplied: boolean
	defaultNote: string | undefined
	versionPin: boolean
	lifts: LiftExemption[]
	permanent: string[]
	ci: ReturnType<typeof detectCi>
}

export function status(dir: string, pm: PackageManager, now: Date = new Date()): StatusResult {
	const cfg = MANAGERS[pm]
	const { path, lines } = load(dir, pm)
	const raw = readAge(pm, lines)
	const exemptions = readExemptions(pm, lines).map((e) => ({
		...e,
		kind: (e.until ? 'lift' : 'permanent') as 'lift' | 'permanent',
		expired: e.until ? new Date(e.until) <= now : false,
	}))
	return {
		packageManager: pm,
		file: path,
		setting: cfg.ageKey,
		value: raw ?? null,
		unit: cfg.unit,
		minutes: raw === undefined ? cfg.defaultMinutes : (toMinutes(pm, raw) ?? null),
		defaultApplied: raw === undefined,
		defaultNote: raw === undefined ? cfg.defaultNote : undefined,
		versionPin: cfg.versionPin,
		lifts: exemptions.filter((e) => e.kind === 'lift'),
		permanent: exemptions.filter((e) => e.kind === 'permanent').map((e) => e.value),
		ci: detectCi(dir),
	}
}

// ── lift ──────────────────────────────────────────────────────────────────────

function splitSpec(spec: string): { name: string; version: string | undefined } {
	const at = spec.lastIndexOf('@')
	if (at <= 0) return { name: spec, version: undefined }
	return { name: spec.slice(0, at), version: spec.slice(at + 1) }
}

function npmView(name: string, field: string): unknown {
	const parsed = JSON.parse(execFileSync('npm', ['view', name, field, '--json'], { encoding: 'utf8' }))
	return Array.isArray(parsed) ? parsed.find(Boolean) : parsed
}

export interface Registry {
	distTags: (name: string) => Record<string, string>
	times: (name: string) => Record<string, string>
}

const npmRegistry: Registry = {
	distTags: (name) => (npmView(name, 'dist-tags') as Record<string, string> | undefined) ?? {},
	times: (name) => (npmView(name, 'time') as Record<string, string> | undefined) ?? {},
}

const EXACT = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/
const TAG = /^[A-Za-z][\w.-]*$/

export type ResolvedSpec = { name: string; version: string; tag?: string } | { error: string }

/** `pkg`, `pkg@tag`, or `pkg@x.y.z` → an exact version. Ranges are refused. */
export function resolveSpec(spec: string, registry: Registry = npmRegistry): ResolvedSpec {
	const { name, version } = splitSpec(spec)
	if (!name || name.startsWith('.') || name.includes(' ')) return { error: `invalid package "${spec}"` }
	if (version && EXACT.test(version)) return { name, version }
	if (version !== undefined && !TAG.test(version)) {
		return { error: `"${spec}" is a range; pass an exact version, a dist-tag, or the bare name for latest` }
	}
	const tag = version ?? 'latest'
	const resolved = registry.distTags(name)[tag]
	if (!resolved) return { error: `${name} has no "${tag}" dist-tag` }
	return { name, version: resolved, tag }
}

export interface LiftOptions {
	nameWide?: boolean
	until?: string
	now?: Date
	registry?: Registry
}

export type LiftResult =
	| { ok: false; error: string }
	| { ok: true; changed: false; entry: string; spec: string; reason: string }
	| {
			ok: true
			changed: true
			file: string
			spec: string
			tag: string | undefined
			entry: string
			until: string
			nameWide: boolean
	  }

export function lift(dir: string, pm: PackageManager, input: string, options: LiftOptions = {}): LiftResult {
	const { nameWide = false, until, now = new Date(), registry = npmRegistry } = options
	const cfg = MANAGERS[pm]
	const parsed = resolveSpec(input, registry)
	if ('error' in parsed) return { ok: false, error: parsed.error }
	const spec = `${parsed.name}@${parsed.version}`
	if (!cfg.versionPin && !nameWide) {
		return {
			ok: false,
			error: `${pm} can only exempt a whole package name; pass --name-wide to exempt every version of ${parsed.name} until the lift expires`,
		}
	}
	const current = status(dir, pm, now)
	const entry = cfg.versionPin ? spec : parsed.name
	const covered = [...current.permanent, ...current.lifts.map((l) => l.value)].find(
		(v) => v === entry || v === parsed.name || (v.endsWith('/*') && parsed.name.startsWith(v.slice(0, -1))),
	)
	if (covered) return { ok: true, changed: false, entry, spec, reason: `already exempt by "${covered}"` }

	let expiry = until ? new Date(until) : undefined
	if (!expiry) {
		if (!current.minutes) return { ok: false, error: `${cfg.ageKey} is not set; there is no gate to lift` }
		const published = registry.times(parsed.name)[parsed.version]
		if (!published) return { ok: false, error: `npm has no publish time for ${spec}` }
		expiry = new Date(new Date(published).getTime() + current.minutes * 60_000)
		expiry.setUTCMinutes(0, 0, 0)
		expiry = new Date(expiry.getTime() + 3_600_000)
	}
	if (Number.isNaN(expiry.getTime())) return { ok: false, error: `invalid expiry "${until}"` }
	if (expiry <= now) {
		return { ok: true, changed: false, entry, spec, reason: `${spec} already clears the gate; no lift needed` }
	}

	const iso = expiry.toISOString().replace(/\.\d{3}Z$/, 'Z')
	const markerText = `min-release-age: lift ${spec} until ${iso}`
	const { path, lines } = load(dir, pm)
	insertEntry(pm, lines, entry, markerText)
	save(path, lines)
	return { ok: true, changed: true, file: path, spec, tag: parsed.tag, entry, until: iso, nameWide: !cfg.versionPin }
}

// ── restore ───────────────────────────────────────────────────────────────────

export interface RestoreOptions {
	now?: Date
	dryRun?: boolean
}

interface RestoreEntry {
	lift: string
	until: string
	entry?: string
}

export type RestoreResult =
	| { ok: false; error: string }
	| { ok: true; file: string; dryRun: boolean; removed: RestoreEntry[]; kept: RestoreEntry[] }

export function restore(dir: string, pm: PackageManager, options: RestoreOptions = {}): RestoreResult {
	const { now = new Date(), dryRun = false } = options
	const { excludeKey, format } = MANAGERS[pm]
	const { path, lines } = load(dir, pm)
	const removed: RestoreEntry[] = []
	const kept: RestoreEntry[] = []
	const out: string[] = []
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? ''
		const m = MARKER.exec(line)
		if (!m?.[1] || !m[2]) {
			out.push(line)
			continue
		}
		const until = new Date(m[2])
		if (Number.isNaN(until.getTime()) || until > now) {
			kept.push({ lift: m[1], until: m[2] })
			out.push(line)
			continue
		}
		const next = lines[i + 1] ?? ''
		const name = splitSpec(m[1]).name ?? m[1]
		if (!next.includes(name)) {
			return { ok: false, error: `${path}:${i + 1}: marker for ${m[1]} is not followed by its entry` }
		}
		removed.push({ lift: m[1], until: m[2], entry: next.trim() })
		i++
	}
	if (format === 'yaml') {
		const block = yamlBlock(out, excludeKey)
		if (block && !block.flow && !out.slice(block.start + 1, block.end).some((l) => /^\s+-\s/.test(l))) {
			out.splice(block.start, block.end - block.start, `${excludeKey}: []`)
		}
	}
	if (removed.length && !dryRun) save(path, out)
	return { ok: true, file: path, dryRun, removed, kept }
}
