import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import {
	ConfigError,
	LEGACY_WEIGHTS_FILE,
	OVERRIDE_FILE,
	overrideFor,
	parseWeightsSection,
	readConfig,
} from './config.js'
import { AREA_WEIGHTS } from './score.js'

const skillDir = join(dirname(fileURLToPath(import.meta.url)), '../../skills/agent-readiness')

let dir: string
let home: string

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'agent-readiness-config-'))
	home = mkdtempSync(join(tmpdir(), 'agent-readiness-home-'))
})

afterEach(() => {
	rmSync(dir, { recursive: true, force: true })
	rmSync(home, { recursive: true, force: true })
})

function write(path: string, text: string) {
	mkdirSync(dirname(join(dir, path)), { recursive: true })
	writeFileSync(join(dir, path), text)
}

const override = (items: string) => `---\nmerge: merge-sections\n---\n\n## Weights\n\n${items}\n`
const read = () => readConfig(dir, { skillDir, home, env: {} })

describe('the shipped reference', () => {
	it('holds the same weights as the code defaults', () => {
		const text = readFileSync(join(skillDir, 'references/repobuddy.readiness.md'), 'utf8')
		expect(parseWeightsSection(text, 'shipped')).toEqual(AREA_WEIGHTS)
	})
})

describe('readConfig', () => {
	it('reads the default weights from the skill when nothing overrides them', async () => {
		expect(await read()).toEqual({ weights: AREA_WEIGHTS, warnings: [] })
	})

	it('returns no weights without the skill folder or any override', async () => {
		expect(await readConfig(dir, { home, env: {} })).toEqual({ warnings: [] })
	})

	it('applies a project override of the Weights section over the default', async () => {
		write(OVERRIDE_FILE, override('- verification: 40\n- noise: 0'))
		// merge-sections replaces the whole section; score() fills the areas it leaves out with the defaults.
		expect((await read()).weights).toEqual({ verification: 40, noise: 0 })
	})

	it('reads an override with no skill folder', async () => {
		write(OVERRIDE_FILE, override('- noise: 30'))
		expect((await readConfig(dir, { home, env: {} })).weights).toEqual({ noise: 30 })
	})

	it('reads a user override', async () => {
		mkdirSync(join(home, '.agents/references'), { recursive: true })
		writeFileSync(join(home, '.agents/references/repobuddy.readiness.md'), override('- noise: 20'))
		expect((await read()).weights?.noise).toBe(20)
	})

	it.each([
		['- security: 10', /unknown area "security"/],
		['- noise: -1', /"noise" must be a non-negative number/],
		['- noise: lots', /"noise" must be a non-negative number/],
		['- noise 30', /is not "- <area>: <weight>"/],
	])('rejects the override item %s', async (items, message) => {
		write(OVERRIDE_FILE, override(items))
		await expect(read()).rejects.toThrow(ConfigError)
		await expect(read()).rejects.toThrow(message)
	})

	describe(`the deprecated ${LEGACY_WEIGHTS_FILE}`, () => {
		it('is still read without a project override, with a warning naming the file to create', async () => {
			write(LEGACY_WEIGHTS_FILE, '{ "verification": 40, "noise": 0 }')
			const config = await read()
			expect(config.weights).toEqual({ ...AREA_WEIGHTS, verification: 40, noise: 0 })
			expect(config.warnings).toEqual([
				`${LEGACY_WEIGHTS_FILE} is deprecated and will stop being read. Move it to ${OVERRIDE_FILE}:\n\n${overrideFor({ verification: 40, noise: 0 })}`,
			])
		})

		it('is ignored, with a warning, when a project override exists', async () => {
			write(LEGACY_WEIGHTS_FILE, '{ "noise": 0 }')
			write(OVERRIDE_FILE, override('- noise: 30'))
			const config = await read()
			expect(config.weights?.noise).toBe(30)
			expect(config.warnings[0]).toMatch(/is ignored: .agents\/references\/repobuddy.readiness.md overrides/)
		})

		it.each([
			['not json', /invalid JSON/],
			['[]', /expected an object/],
			['{ "weights": { "noise": 30 } }', /unknown area "weights"/],
			['{ "toString": 10 }', /unknown area "toString"/],
			['{ "noise": "5" }', /"noise" must be a non-negative number/],
		])('rejects %s', async (text, message) => {
			write(LEGACY_WEIGHTS_FILE, text)
			await expect(read()).rejects.toThrow(message)
		})
	})
})

describe('parseWeightsSection', () => {
	it('reads only the Weights section, ignoring prose and other sections', () => {
		const text = [
			'## Notes',
			'- noise: 99',
			'## Weights',
			'Prose about the weights.',
			'* `noise`: 30',
			'+ environment: 2.5',
			'### Detail',
			'- instructions: 1',
			'## Other',
			'- verification: 99',
		].join('\n')
		expect(parseWeightsSection(text, 'x')).toEqual({ noise: 30, environment: 2.5, instructions: 1 })
	})

	it('reads nothing without a Weights section', () => {
		expect(parseWeightsSection('## Other\n- noise: 1', 'x')).toEqual({})
	})
})

it('overrideFor writes a merge-sections override', () => {
	expect(overrideFor({ noise: 30 })).toBe(override('- noise: 30'))
})
