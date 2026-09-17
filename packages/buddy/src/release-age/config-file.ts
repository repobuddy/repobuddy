import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { MANAGERS, type PackageManager } from './managers.js'

export const MARKER = /^\s*#\s*min-release-age: lift (\S+) until (\S+)\s*$/

export interface Exemption {
	value: string
	line: number
	until: string | null
}

export function toMinutes(pm: PackageManager, raw: string): number | undefined {
	const unit = MANAGERS[pm].unit
	if (unit === 'duration') {
		const m = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)?$/.exec(String(raw).trim())
		if (!m) return undefined
		const key = m[2] ?? 'm'
		const factor = { ms: 1 / 60000, s: 1 / 60, m: 1, h: 60, d: 1440, w: 10080 }[
			key as 'ms' | 's' | 'm' | 'h' | 'd' | 'w'
		]
		return Number(m[1]) * factor
	}
	const n = Number(raw)
	if (Number.isNaN(n)) return undefined
	return unit === 'days' ? n * 1440 : unit === 'seconds' ? n / 60 : n
}

function unquote(value: string): string {
	return value.trim().replace(/^(['"])(.*)\1$/, '$2')
}

export function readAge(pm: PackageManager, lines: string[]): string | undefined {
	const { ageKey, format } = MANAGERS[pm]
	const re =
		format === 'ini'
			? new RegExp(`^\\s*${ageKey}\\s*=\\s*(.+?)\\s*$`)
			: format === 'toml'
				? new RegExp(`^\\s*${ageKey}\\s*=\\s*(.+?)\\s*(#.*)?$`)
				: new RegExp(`^${ageKey}:\\s*(.+?)\\s*(#.*)?$`)
	for (const line of format === 'toml' ? sectionLines(lines, 'install') : lines) {
		const m = re.exec(line)
		if (m?.[1] !== undefined) return unquote(m[1])
	}
	return undefined
}

function sectionLines(lines: string[], section: string): string[] {
	const out: string[] = []
	let inside = false
	for (const line of lines) {
		const header = /^\s*\[([^\]]+)\]\s*(#.*)?$/.exec(line)
		if (header) inside = header[1]?.trim() === section
		else if (inside) out.push(line)
	}
	return out
}

/** Every exemption entry, with its marker when it has one. */
export function readExemptions(pm: PackageManager, lines: string[]): Exemption[] {
	const { excludeKey, format } = MANAGERS[pm]
	const entries: Exemption[] = []
	const push = (value: string, i: number) => {
		const marker = i > 0 ? MARKER.exec(lines[i - 1] ?? '') : null
		entries.push({ value, line: i + 1, until: marker?.[2] ?? null })
	}
	if (format === 'ini') {
		const re = new RegExp(`^\\s*${excludeKey}(\\[\\])?\\s*=\\s*(.+?)\\s*$`)
		lines.forEach((line, i) => {
			const m = re.exec(line)
			if (m?.[2] !== undefined) push(unquote(m[2]), i)
		})
		return entries
	}
	if (format === 'yaml') {
		const block = yamlBlock(lines, excludeKey)
		if (!block) return entries
		for (let i = block.start + 1; i < block.end; i++) {
			const m = /^\s+-\s+(.+?)\s*(#.*)?$/.exec(lines[i] ?? '')
			if (m?.[1] !== undefined) push(unquote(m[1]), i)
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
		const m = /^\s*(["'])(.+?)\1\s*,?\s*(#.*)?$/.exec(lines[i] ?? '')
		if (m?.[2] !== undefined) push(m[2], i)
	}
	return entries
}

export interface YamlBlock {
	start: number
	end: number
	inline: string[]
	flow: boolean
}

/** The `key:` block in a YAML file: [start, end) line range and any flow-style items. */
export function yamlBlock(lines: string[], key: string): YamlBlock | undefined {
	const start = lines.findIndex((l) => new RegExp(`^${key}:`).test(l))
	if (start < 0) return undefined
	const firstLine = lines[start] ?? ''
	const rest = firstLine
		.slice(key.length + 1)
		.replace(/#.*$/, '')
		.trim()
	const inline = /^\[(.*)\]$/.exec(rest)?.[1]
	let end = start + 1
	while (end < lines.length && (/^\s/.test(lines[end] ?? '') || lines[end] === '')) end++
	while (end > start + 1 && (lines[end - 1] ?? '').trim() === '') end--
	return {
		start,
		end,
		inline: inline ? inline.split(',').map(unquote).filter(Boolean) : [],
		flow: inline !== undefined,
	}
}

interface TomlArray {
	start: number
	end: number
	indent: string
	inline: string[]
}

/** The `key = [...]` array inside `[install]` of a TOML file. */
function tomlArray(lines: string[], key: string): TomlArray | undefined {
	let inside = false
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? ''
		const header = /^\s*\[([^\]]+)\]\s*(#.*)?$/.exec(line)
		if (header) {
			inside = header[1]?.trim() === 'install'
			continue
		}
		if (!inside) continue
		const m = new RegExp(`^(\\s*)${key}\\s*=\\s*\\[(.*)$`).exec(line)
		if (!m) continue
		const indent = m[1] ?? ''
		const rest = m[2] ?? ''
		const closed = /^(.*)\]\s*(#.*)?$/.exec(rest)
		if (closed) {
			return {
				start: i,
				end: i,
				indent,
				inline: (closed[1] ?? '').split(',').map(unquote).filter(Boolean),
			}
		}
		let end = i + 1
		while (end < lines.length && !/^\s*\]/.test(lines[end] ?? '')) end++
		return { start: i, end, indent, inline: [] }
	}
	return undefined
}

export interface LoadedFile {
	path: string
	text: string
	lines: string[]
}

export function load(dir: string, pm: PackageManager): LoadedFile {
	const path = join(dir, MANAGERS[pm].file)
	const text = existsSync(path) ? readFileSync(path, 'utf8') : ''
	return { path, text, lines: text === '' ? [] : text.replace(/\n$/, '').split('\n') }
}

export function save(path: string, lines: string[]): void {
	writeFileSync(path, `${lines.join('\n')}\n`)
}

export function insertEntry(pm: PackageManager, lines: string[], entry: string, markerText: string): void {
	const { excludeKey, format } = MANAGERS[pm]
	if (format === 'ini') {
		for (let i = 0; i < lines.length; i++) {
			lines[i] = (lines[i] ?? '').replace(new RegExp(`^(\\s*${excludeKey})\\s*=`), '$1[]=')
		}
		lines.push(`# ${markerText}`, `${excludeKey}[]=${entry}`)
		return
	}
	if (format === 'yaml') {
		const quoted = `'${entry}'`
		const block = yamlBlock(lines, excludeKey)
		if (!block) {
			if (lines.length && (lines[lines.length - 1] ?? '').trim() !== '') lines.push('')
			lines.push(`${excludeKey}:`, `  # ${markerText}`, `  - ${quoted}`)
			return
		}
		if (block.flow || block.end === block.start + 1) {
			const items = block.inline.map((v) => `  - '${v}'`)
			lines.splice(block.start, 1, `${excludeKey}:`, ...items, `  # ${markerText}`, `  - ${quoted}`)
			return
		}
		const firstItem = lines.slice(block.start + 1, block.end).find((l) => /^\s+-\s/.test(l))
		const indent = firstItem ? (/^(\s+)/.exec(firstItem)?.[1] ?? '  ') : '  '
		lines.splice(block.end, 0, `${indent}# ${markerText}`, `${indent}- ${quoted}`)
		return
	}
	const arr = tomlArray(lines, excludeKey)
	if (!arr) {
		let header = lines.findIndex((l) => /^\s*\[install\]\s*(#.*)?$/.test(l))
		if (header < 0) {
			if (lines.length && (lines[lines.length - 1] ?? '').trim() !== '') lines.push('')
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
		const line = lines[i] ?? ''
		if (line.trim() === '' || /^\s*#/.test(line)) continue
		const m = /^(\s*(["']).+?\2)\s*(,)?\s*(#.*)?$/.exec(line)
		if (m && !m[3]) lines[i] = `${m[1]},${m[4] ? ` ${m[4]}` : ''}`
		break
	}
	lines.splice(arr.end, 0, `${inner}# ${markerText}`, `${inner}"${entry}",`)
}
