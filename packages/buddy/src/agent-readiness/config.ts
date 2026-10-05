/**
 * Reads readiness's tunables from the reference `repobuddy.readiness`, resolved by
 * `@cyberuni/agent-harness` across the managed, project (`.agents/references/`), user
 * (`~/.agents/references/`), and plugin tiers. The skill ships the default copy as its plugin layer; a
 * repo overrides the `## Weights` section with `merge: merge-sections` in
 * `.agents/references/repobuddy.readiness.md`. Weights order fixes and area scores, never gates or the
 * level, so an override cannot lower the bar `--check` holds.
 *
 * For one release, a repo's old `.agents/readiness/weights.json` is still read when no project
 * override exists, with a warning naming the file to create instead.
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { loadReference } from '@cyberuni/agent-harness'
import { AREA_WEIGHTS, type WeightedArea, type Weights } from './score.js'

export const REFERENCE = 'repobuddy.readiness'
export const OVERRIDE_FILE = `.agents/references/${REFERENCE}.md`
/** The override file before the reference: read for one release, with a warning. */
export const LEGACY_WEIGHTS_FILE = '.agents/readiness/weights.json'

export interface Config {
	weights?: Partial<Weights>
	/** Things the user should change, such as a deprecated file; the script prints them on stderr. */
	warnings: string[]
}

export interface ConfigOptions {
	/** The folder holding the shipped `references/repobuddy.readiness.md`: the skill's own folder. */
	skillDir?: string | undefined
	/** The user tier's home; defaults to the machine's. */
	home?: string | undefined
	env?: Readonly<Record<string, string | undefined>>
}

/** A config file that exists but is malformed. The script exits 2 on it rather than scoring with a guess. */
export class ConfigError extends Error {
	override name = 'ConfigError'
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function checkWeight(where: string, area: string, value: unknown): [WeightedArea, number] {
	if (!Object.keys(AREA_WEIGHTS).includes(area)) {
		throw new ConfigError(`${where}: unknown area "${area}" (one of ${Object.keys(AREA_WEIGHTS).join(', ')})`)
	}
	if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
		throw new ConfigError(`${where}: weight for "${area}" must be a non-negative number`)
	}
	return [area as WeightedArea, value]
}

/** The `## Weights` section's `- <area>: <number>` items. Prose in the section is ignored. */
export function parseWeightsSection(markdown: string, where: string): Partial<Weights> {
	const weights: Partial<Weights> = {}
	let inSection = false
	for (const line of markdown.split(/\r?\n/)) {
		const heading = /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line)
		if (heading) {
			if (inSection && (heading[1] as string).length <= 2) break
			if ((heading[1] as string).length === 2) inSection = heading[2] === 'Weights'
			continue
		}
		if (!inSection) continue
		const item = /^\s*[-*+]\s+(.*)$/.exec(line)
		if (!item) continue
		const entry = /^`?([^`:\s]+)`?\s*:\s*(.+?)\s*$/.exec(item[1] as string)
		if (!entry) throw new ConfigError(`${where}: "${line.trim()}" in ## Weights is not "- <area>: <weight>"`)
		const text = entry[2] as string
		const [area, value] = checkWeight(where, entry[1] as string, /^\d+(\.\d+)?$/.test(text) ? Number(text) : text)
		weights[area] = value
	}
	return weights
}

function readLegacy(dir: string): Partial<Weights> {
	const text = readFileSync(join(dir, LEGACY_WEIGHTS_FILE), 'utf8')
	let raw: unknown
	try {
		raw = JSON.parse(text)
	} catch (e) {
		throw new ConfigError(`${LEGACY_WEIGHTS_FILE}: invalid JSON (${(e as Error).message})`)
	}
	if (!isObject(raw)) throw new ConfigError(`${LEGACY_WEIGHTS_FILE}: expected an object of area weights`)
	return Object.fromEntries(Object.entries(raw).map(([area, value]) => checkWeight(LEGACY_WEIGHTS_FILE, area, value)))
}

/** The override file that replaces `weights.json`, ready to save. */
export function overrideFor(weights: Partial<Weights>): string {
	const items = Object.entries(weights).map(([area, weight]) => `- ${area}: ${weight}`)
	return ['---', 'merge: merge-sections', '---', '', '## Weights', '', ...items, ''].join('\n')
}

export async function readConfig(dir: string, options: ConfigOptions = {}): Promise<Config> {
	const resolved = await loadReference(REFERENCE, {
		root: dir,
		...(options.skillDir ? { plugin: { name: 'repobuddy', root: options.skillDir } } : {}),
		...(options.home ? { home: options.home } : {}),
		...(options.env ? { env: options.env } : {}),
	})
	const warnings: string[] = []
	let weights: Partial<Weights> = {}
	if (resolved.status === 'found' && resolved.content !== undefined) {
		weights = parseWeightsSection(resolved.content, resolved.path ?? REFERENCE)
	}
	if (existsSync(join(dir, LEGACY_WEIGHTS_FILE))) {
		if (resolved.layers.some((layer) => layer.tier === 'project')) {
			warnings.push(`${LEGACY_WEIGHTS_FILE} is ignored: ${OVERRIDE_FILE} overrides the weights. Delete it.`)
		} else {
			const legacy = readLegacy(dir)
			weights = { ...weights, ...legacy }
			warnings.push(
				`${LEGACY_WEIGHTS_FILE} is deprecated and will stop being read. Move it to ${OVERRIDE_FILE}:\n\n${overrideFor(legacy)}`,
			)
		}
	}
	return Object.keys(weights).length === 0 ? { warnings } : { weights, warnings }
}
