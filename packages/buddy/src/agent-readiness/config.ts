/**
 * Reads a repo's optional `.agents/agent-readiness.json`. It holds weight overrides only: weights order
 * fixes and area scores, never gates or the level, so an override cannot lower the bar `--check` holds.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AREA_WEIGHTS, type WeightedArea, type Weights } from './score.js'

export const CONFIG_FILE = '.agents/agent-readiness.json'

export interface Config {
	weights?: Partial<Weights>
}

/** A config file that exists but is malformed. The script exits 2 on it rather than scoring with a guess. */
export class ConfigError extends Error {
	override name = 'ConfigError'
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function readConfig(dir: string): Config {
	let text: string
	try {
		text = readFileSync(join(dir, CONFIG_FILE), 'utf8')
	} catch {
		return {}
	}
	let raw: unknown
	try {
		raw = JSON.parse(text)
	} catch (e) {
		throw new ConfigError(`${CONFIG_FILE}: invalid JSON (${(e as Error).message})`)
	}
	if (!isObject(raw)) throw new ConfigError(`${CONFIG_FILE}: expected an object`)
	for (const key of Object.keys(raw)) {
		if (key !== 'weights') throw new ConfigError(`${CONFIG_FILE}: unknown key "${key}" (only "weights" is read)`)
	}
	const rawWeights = raw['weights']
	if (rawWeights === undefined) return {}
	if (!isObject(rawWeights)) throw new ConfigError(`${CONFIG_FILE}: "weights" must be an object`)

	const weights: Partial<Weights> = {}
	for (const [area, value] of Object.entries(rawWeights)) {
		if (!Object.keys(AREA_WEIGHTS).includes(area)) {
			throw new ConfigError(`${CONFIG_FILE}: unknown area "${area}" (one of ${Object.keys(AREA_WEIGHTS).join(', ')})`)
		}
		if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
			throw new ConfigError(`${CONFIG_FILE}: weight for "${area}" must be a non-negative number`)
		}
		weights[area as WeightedArea] = value
	}
	return { weights }
}
