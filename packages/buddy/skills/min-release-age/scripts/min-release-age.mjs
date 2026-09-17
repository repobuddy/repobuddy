#!/usr/bin/env node
/**
 * Read and edit a repository's minimum-release-age exemptions.
 *
 *   node scripts/min-release-age.mjs status  [--dir <repo>] [--json]
 *   node scripts/min-release-age.mjs lift    <pkg[@version|@tag]> [--dir <repo>] [--pm <pm>] [--name-wide] [--until <ISO>] [--json]
 *   node scripts/min-release-age.mjs restore [--dir <repo>] [--now <ISO>] [--dry-run] [--json] [--github-output]
 *
 * Supports pnpm (pnpm-workspace.yaml), Yarn Berry (.yarnrc.yml), npm (.npmrc) and bun (bunfig.toml).
 *
 * Every exemption this script adds is two lines: a marker comment, then the entry.
 *
 *   # min-release-age: lift <pkg@version> until <ISO>
 *   - '<pkg@version>'
 *
 * `restore` deletes the marker and its entry once `until` has passed. Entries without a marker are
 * permanent policy and are never touched.
 *
 * `lift` takes `pkg` (latest), `pkg@tag`, or `pkg@x.y.z` and always writes the exact version.
 * It sets `until` to the version's publish time plus the configured window: past that moment the
 * version clears the gate on its own and the exemption does nothing. pnpm and Yarn exempt the single
 * version; npm and bun can only exempt the whole package name, which `lift` refuses without
 * `--name-wide`.
 *
 * stdout: a human summary, or JSON with --json. stderr: errors.
 * Exit 0 on success, 1 on a failed lift or restore, 2 on bad usage.
 */

import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const MARKER = /^\s*#\s*min-release-age: lift (\S+) until (\S+)\s*$/
const WORKFLOW = '.github/workflows/min-release-age.yml'

const MANAGERS = {
	pnpm: {
		file: 'pnpm-workspace.yaml',
		ageKey: 'minimumReleaseAge',
		excludeKey: 'minimumReleaseAgeExclude',
		unit: 'minutes',
		defaultMinutes: 1440,
		defaultNote: 'pnpm 11+ defaults to 1440 minutes',
		versionPin: true,
		format: 'yaml',
	},
	yarn: {
		file: '.yarnrc.yml',
		ageKey: 'npmMinimalAgeGate',
		excludeKey: 'npmPreapprovedPackages',
		unit: 'duration',
		defaultMinutes: 1440,
		defaultNote: 'Yarn 4.10+ defaults to 1d',
		versionPin: true,
		format: 'yaml',
	},
	npm: {
		file: '.npmrc',
		ageKey: 'min-release-age',
		excludeKey: 'min-release-age-exclude',
		unit: 'days',
		defaultMinutes: 0,
		defaultNote: 'npm has no default gate',
		versionPin: false,
		format: 'ini',
	},
	bun: {
		file: 'bunfig.toml',
		ageKey: 'minimumReleaseAge',
		excludeKey: 'minimumReleaseAgeExcludes',
		unit: 'seconds',
		defaultMinutes: 0,
		defaultNote: 'bun has no default gate',
		versionPin: false,
		format: 'toml',
	},
}

// ── args ──────────────────────────────────────────────────────────────────────

function usage(message) {
	process.stderr.write(`${message}\n`)
	process.stderr.write(
		'usage: min-release-age.mjs <status|lift <pkg[@version|@tag]>|restore> [--dir <repo>] [--pm <pm>] [--name-wide] [--until <ISO>] [--now <ISO>] [--dry-run] [--json] [--github-output]\n',
	)
	process.exit(2)
}

function parseArgs(argv) {
	const opts = { positional: [] }
	const valued = new Set(['--dir', '--pm', '--until', '--now'])
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]
		if (valued.has(a)) {
			if (argv[i + 1] === undefined) usage(`${a} needs a value`)
			opts[a.slice(2)] = argv[++i]
		} else if (a.startsWith('--')) opts[a.slice(2)] = true
		else opts.positional.push(a)
	}
	return opts
}

// ── detection ─────────────────────────────────────────────────────────────────

export function detectManager(dir) {
	const pkgPath = join(dir, 'package.json')
	if (existsSync(pkgPath)) {
		const field = JSON.parse(readFileSync(pkgPath, 'utf8')).packageManager
		const name = typeof field === 'string' ? field.split('@')[0] : undefined
		if (name && MANAGERS[name]) return name
	}
	if (existsSync(join(dir, 'pnpm-lock.yaml')) || existsSync(join(dir, 'pnpm-workspace.yaml'))) return 'pnpm'
	if (existsSync(join(dir, '.yarnrc.yml')) || existsSync(join(dir, 'yarn.lock'))) return 'yarn'
	if (existsSync(join(dir, 'bun.lock')) || existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bunfig.toml')))
		return 'bun'
	if (existsSync(join(dir, 'package-lock.json')) || existsSync(join(dir, '.npmrc'))) return 'npm'
	return undefined
}

function toMinutes(pm, raw) {
	const unit = MANAGERS[pm].unit
	if (unit === 'duration') {
		const m = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)?$/.exec(String(raw).trim())
		if (!m) return undefined
		const factor = { ms: 1 / 60000, s: 1 / 60, m: 1, h: 60, d: 1440, w: 10080 }[m[2] ?? 'm']
		return Number(m[1]) * factor
	}
	const n = Number(raw)
	if (Number.isNaN(n)) return undefined
	return unit === 'days' ? n * 1440 : unit === 'seconds' ? n / 60 : n
}

function unquote(value) {
	return value.trim().replace(/^(['"])(.*)\1$/, '$2')
}

function readAge(pm, lines) {
	const { ageKey, format } = MANAGERS[pm]
	const re =
		format === 'ini'
			? new RegExp(`^\\s*${ageKey}\\s*=\\s*(.+?)\\s*$`)
			: format === 'toml'
				? new RegExp(`^\\s*${ageKey}\\s*=\\s*(.+?)\\s*(#.*)?$`)
				: new RegExp(`^${ageKey}:\\s*(.+?)\\s*(#.*)?$`)
	for (const line of format === 'toml' ? sectionLines(lines, 'install') : lines) {
		const m = re.exec(line)
		if (m) return unquote(m[1])
	}
	return undefined
}

function sectionLines(lines, section) {
	const out = []
	let inside = false
	for (const line of lines) {
		const header = /^\s*\[([^\]]+)\]\s*(#.*)?$/.exec(line)
		if (header) inside = header[1].trim() === section
		else if (inside) out.push(line)
	}
	return out
}

/** Every exemption entry, with its marker when it has one. */
function readExemptions(pm, lines) {
	const { excludeKey, format } = MANAGERS[pm]
	const entries = []
	const push = (value, i) => {
		const marker = i > 0 ? MARKER.exec(lines[i - 1]) : null
		entries.push({ value, line: i + 1, until: marker?.[2] ?? null })
	}
	if (format === 'ini') {
		const re = new RegExp(`^\\s*${excludeKey}(\\[\\])?\\s*=\\s*(.+?)\\s*$`)
		lines.forEach((line, i) => {
			const m = re.exec(line)
			if (m) push(unquote(m[2]), i)
		})
		return entries
	}
	if (format === 'yaml') {
		const block = yamlBlock(lines, excludeKey)
		if (!block) return entries
		for (let i = block.start + 1; i < block.end; i++) {
			const m = /^\s+-\s+(.+?)\s*(#.*)?$/.exec(lines[i])
			if (m) push(unquote(m[1]), i)
		}
		for (const inline of block.inline) entries.push({ value: inline, line: block.start + 1, until: null })
		return entries
	}
	const arr = tomlArray(lines, excludeKey)
	if (!arr) return entries
	if (arr.start === arr.end) {
		for (const v of arr.inline) entries.push({ value: v, line: arr.start + 1, until: null })
		return entries
	}
	for (let i = arr.start + 1; i < arr.end; i++) {
		const m = /^\s*(["'])(.+?)\1\s*,?\s*(#.*)?$/.exec(lines[i])
		if (m) push(m[2], i)
	}
	return entries
}

/** The `key:` block in a YAML file: [start, end) line range and any flow-style items. */
function yamlBlock(lines, key) {
	const start = lines.findIndex((l) => new RegExp(`^${key}:`).test(l))
	if (start < 0) return undefined
	const rest = lines[start]
		.slice(key.length + 1)
		.replace(/#.*$/, '')
		.trim()
	const inline = /^\[(.*)\]$/.exec(rest)?.[1]
	let end = start + 1
	while (end < lines.length && (/^\s/.test(lines[end]) || lines[end] === '')) end++
	while (end > start + 1 && lines[end - 1].trim() === '') end--
	return {
		start,
		end,
		inline: inline ? inline.split(',').map(unquote).filter(Boolean) : [],
		flow: inline !== undefined,
	}
}

/** The `key = [...]` array inside `[install]` of a TOML file. */
function tomlArray(lines, key) {
	let inside = false
	for (let i = 0; i < lines.length; i++) {
		const header = /^\s*\[([^\]]+)\]\s*(#.*)?$/.exec(lines[i])
		if (header) {
			inside = header[1].trim() === 'install'
			continue
		}
		if (!inside) continue
		const m = new RegExp(`^(\\s*)${key}\\s*=\\s*\\[(.*)$`).exec(lines[i])
		if (!m) continue
		const closed = /^(.*)\]\s*(#.*)?$/.exec(m[2])
		if (closed) {
			return {
				start: i,
				end: i,
				indent: m[1],
				inline: closed[1].split(',').map(unquote).filter(Boolean),
			}
		}
		let end = i + 1
		while (end < lines.length && !/^\s*\]/.test(lines[end])) end++
		return { start: i, end, indent: m[1], inline: [] }
	}
	return undefined
}

function load(dir, pm) {
	const path = join(dir, MANAGERS[pm].file)
	const text = existsSync(path) ? readFileSync(path, 'utf8') : ''
	return { path, text, lines: text === '' ? [] : text.replace(/\n$/, '').split('\n') }
}

function save(path, lines) {
	writeFileSync(path, `${lines.join('\n')}\n`)
}

// ── status ────────────────────────────────────────────────────────────────────

export function status(dir, pm, now = new Date()) {
	const cfg = MANAGERS[pm]
	const { path, lines } = load(dir, pm)
	const raw = readAge(pm, lines)
	const exemptions = readExemptions(pm, lines).map((e) => ({
		...e,
		kind: e.until ? 'lift' : 'permanent',
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
		workflowInstalled: existsSync(join(dir, WORKFLOW)),
	}
}

// ── lift ──────────────────────────────────────────────────────────────────────

function splitSpec(spec) {
	const at = spec.lastIndexOf('@')
	if (at <= 0) return { name: spec, version: undefined }
	return { name: spec.slice(0, at), version: spec.slice(at + 1) }
}

function npmView(name, field) {
	const parsed = JSON.parse(execFileSync('npm', ['view', name, field, '--json'], { encoding: 'utf8' }))
	return Array.isArray(parsed) ? parsed.find(Boolean) : parsed
}

const npmRegistry = {
	distTags: (name) => npmView(name, 'dist-tags') ?? {},
	times: (name) => npmView(name, 'time') ?? {},
}

const EXACT = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/
const TAG = /^[A-Za-z][\w.-]*$/

/** `pkg`, `pkg@tag`, or `pkg@x.y.z` → an exact version. Ranges are refused. */
export function resolveSpec(spec, registry = npmRegistry) {
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

export function lift(dir, pm, input, { nameWide = false, until, now = new Date(), registry = npmRegistry } = {}) {
	const cfg = MANAGERS[pm]
	const parsed = resolveSpec(input, registry)
	if (parsed.error) return { ok: false, error: parsed.error }
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

function insertEntry(pm, lines, entry, markerText) {
	const { excludeKey, format } = MANAGERS[pm]
	if (format === 'ini') {
		for (let i = 0; i < lines.length; i++) {
			lines[i] = lines[i].replace(new RegExp(`^(\\s*${excludeKey})\\s*=`), '$1[]=')
		}
		lines.push(`# ${markerText}`, `${excludeKey}[]=${entry}`)
		return
	}
	if (format === 'yaml') {
		const quoted = `'${entry}'`
		const block = yamlBlock(lines, excludeKey)
		if (!block) {
			if (lines.length && lines[lines.length - 1].trim() !== '') lines.push('')
			lines.push(`${excludeKey}:`, `  # ${markerText}`, `  - ${quoted}`)
			return
		}
		if (block.flow || block.end === block.start + 1) {
			const items = block.inline.map((v) => `  - '${v}'`)
			lines.splice(block.start, 1, `${excludeKey}:`, ...items, `  # ${markerText}`, `  - ${quoted}`)
			return
		}
		const firstItem = lines.slice(block.start + 1, block.end).find((l) => /^\s+-\s/.test(l))
		const indent = firstItem ? /^(\s+)/.exec(firstItem)[1] : '  '
		lines.splice(block.end, 0, `${indent}# ${markerText}`, `${indent}- ${quoted}`)
		return
	}
	const arr = tomlArray(lines, excludeKey)
	if (!arr) {
		let header = lines.findIndex((l) => /^\s*\[install\]\s*(#.*)?$/.test(l))
		if (header < 0) {
			if (lines.length && lines[lines.length - 1].trim() !== '') lines.push('')
			lines.push('[install]')
			header = lines.length - 1
		}
		lines.splice(header + 1, 0, `${excludeKey} = [`, `  # ${markerText}`, `  "${entry}",`, ']')
		return
	}
	const inner = `${arr.indent}  `
	if (arr.start === arr.end) {
		const items = arr.inline.map((v) => `${inner}"${v}",`)
		lines.splice(
			arr.start,
			1,
			`${arr.indent}${excludeKey} = [`,
			...items,
			`${inner}# ${markerText}`,
			`${inner}"${entry}",`,
			`${arr.indent}]`,
		)
		return
	}
	for (let i = arr.end - 1; i > arr.start; i--) {
		const line = lines[i]
		if (line.trim() === '' || /^\s*#/.test(line)) continue
		const m = /^(\s*(["']).+?\2)\s*(,)?\s*(#.*)?$/.exec(line)
		if (m && !m[3]) lines[i] = `${m[1]},${m[4] ? ` ${m[4]}` : ''}`
		break
	}
	lines.splice(arr.end, 0, `${inner}# ${markerText}`, `${inner}"${entry}",`)
}

// ── restore ───────────────────────────────────────────────────────────────────

export function restore(dir, pm, { now = new Date(), dryRun = false } = {}) {
	const { excludeKey, format } = MANAGERS[pm]
	const { path, lines } = load(dir, pm)
	const removed = []
	const kept = []
	const out = []
	for (let i = 0; i < lines.length; i++) {
		const m = MARKER.exec(lines[i])
		if (!m) {
			out.push(lines[i])
			continue
		}
		const until = new Date(m[2])
		if (Number.isNaN(until.getTime()) || until > now) {
			kept.push({ lift: m[1], until: m[2] })
			out.push(lines[i])
			continue
		}
		const next = lines[i + 1] ?? ''
		const name = splitSpec(m[1])?.name ?? m[1]
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

// ── output ────────────────────────────────────────────────────────────────────

function printStatus(s) {
	const lines = [
		`package manager: ${s.packageManager} (${s.file})`,
		`gate: ${s.setting} = ${s.value ?? `unset — ${s.defaultNote}`}${s.minutes != null ? ` (${s.minutes} minutes)` : ''}`,
		`exemptions: ${s.versionPin ? 'single version' : 'whole package name only'}`,
		`permanent: ${s.permanent.length ? s.permanent.join(', ') : 'none'}`,
		`lifts: ${s.lifts.length ? '' : 'none'}`,
		...s.lifts.map((l) => `  ${l.value} until ${l.until}${l.expired ? ' — EXPIRED' : ''}`),
		`cleanup workflow: ${s.workflowInstalled ? 'installed' : 'not installed'}`,
	]
	process.stdout.write(`${lines.join('\n')}\n`)
}

function writeGithubOutput(result) {
	const target = process.env.GITHUB_OUTPUT
	if (!target) return
	const body = [
		'Removes minimum-release-age lifts whose window has passed. Each version now clears the gate on its own.',
		'',
		...result.removed.map((r) => `- \`${r.lift}\` (expired ${r.until})`),
	].join('\n')
	appendFileSync(target, `removed=${result.removed.length}\nbody<<__MRA__\n${body}\n__MRA__\n`)
}

function main() {
	const opts = parseArgs(process.argv.slice(2))
	const [command, spec] = opts.positional
	const dir = resolve(opts.dir ?? process.cwd())
	const pm = opts.pm ?? detectManager(dir)
	if (!command || !['status', 'lift', 'restore'].includes(command)) usage(`unknown command "${command ?? ''}"`)
	if (!pm || !MANAGERS[pm]) usage(`cannot detect the package manager in ${dir}; pass --pm pnpm|yarn|npm|bun`)
	const now = opts.now ? new Date(opts.now) : new Date()

	let result
	if (command === 'status') {
		result = status(dir, pm, now)
		if (opts.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
		else printStatus(result)
		return
	}
	if (command === 'lift') {
		if (!spec) usage('lift needs <pkg[@version|@tag]>')
		try {
			result = lift(dir, pm, spec, { nameWide: Boolean(opts['name-wide']), until: opts.until, now })
		} catch (error) {
			result = { ok: false, error: error.message }
		}
	} else {
		result = restore(dir, pm, { now, dryRun: Boolean(opts['dry-run']) })
		if (result.ok && opts['github-output']) writeGithubOutput(result)
	}

	if (!result.ok) {
		process.stderr.write(`${result.error}\n`)
		if (opts.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
		process.exit(1)
	}
	if (opts.json) process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
	else if (command === 'lift') {
		process.stdout.write(
			result.changed
				? `lifted ${result.spec}${result.tag ? ` (${result.tag})` : ''} as '${result.entry}' in ${result.file} until ${result.until}${result.nameWide ? ' (whole package name)' : ''}\n`
				: `no change: ${result.reason}\n`,
		)
	} else {
		const verb = result.dryRun ? 'would remove' : 'removed'
		process.stdout.write(
			`${verb} ${result.removed.length} expired lift(s)${result.removed.map((r) => `\n  ${r.lift} (until ${r.until})`).join('')}\n` +
				`${result.kept.length} active lift(s) kept\n`,
		)
	}
}

if (process.argv[1]?.endsWith('min-release-age.mjs')) main()
