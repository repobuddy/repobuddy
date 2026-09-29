/**
 * Reads a repo's optional `.agents/readiness/weights.json`, beside the `bench` task set whose results
 * justify an override. It maps area ids to weights. Weights order fixes and area scores, never gates or
 * the level, so an override cannot lower the bar `--check` holds.
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { AREA_WEIGHTS, type WeightedArea, type Weights } from './score.js'

export const WEIGHTS_FILE = '.agents/readiness/weights.json'

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
		text = readFileSync(join(dir, WEIGHTS_FILE), 'utf8')
	} catch {
		return {}
	}
	let raw: unknown
	try {
		raw = JSON.parse(text)
	} catch (e) {
		throw new ConfigError(`${WEIGHTS_FILE}: invalid JSON (${(e as Error).message})`)
	}
	if (!isObject(raw)) throw new ConfigError(`${WEIGHTS_FILE}: expected an object of area weights`)

	const weights: Partial<Weights> = {}
	for (const [area, value] of Object.entries(raw)) {
		if (!Object.keys(AREA_WEIGHTS).includes(area)) {
			throw new ConfigError(`${WEIGHTS_FILE}: unknown area "${area}" (one of ${Object.keys(AREA_WEIGHTS).join(', ')})`)
		}
		if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
			throw new ConfigError(`${WEIGHTS_FILE}: weight for "${area}" must be a non-negative number`)
		}
		weights[area as WeightedArea] = value
	}
	return Object.keys(weights).length === 0 ? {} : { weights }
}
