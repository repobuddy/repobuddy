import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from '@jest/globals'
import { checkReferences, loadReference, referenceLayers } from 'cyber-agentkit'

// The shipped references as cyber-agentkit 2 resolves them: the plugin's `references/` and each
// skill's defaults, in an empty repository with no harness, so nothing installed on the machine joins.
const pluginRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const skillsDir = join(pluginRoot, 'skills')
const root = mkdtempSync(join(tmpdir(), 'repobuddy-references-'))
const home = mkdtempSync(join(tmpdir(), 'repobuddy-references-home-'))
const base = { root, home, env: {} }
const plugin = { name: 'repobuddy', root: pluginRoot }

afterAll(() => {
	rmSync(root, { recursive: true, force: true })
	rmSync(home, { recursive: true, force: true })
})

const defaults = readdirSync(skillsDir).flatMap((skill) => {
	let files: string[]
	try {
		files = readdirSync(join(skillsDir, skill, 'references'))
	} catch {
		return []
	}
	return files
		.filter((file) => file.endsWith('.default.md'))
		.map((file) => [skill, file.slice(0, -'.default.md'.length)])
})

describe('each skill default', () => {
	it.each(defaults)('%s loads %s with no warning, with the plugin and without it', async (skill, name) => {
		for (const options of [{ ...base, plugin }, base]) {
			const resolved = await loadReference(name, { ...options, defaultSkill: join(skillsDir, skill) })
			expect({ status: resolved.status, warnings: resolved.warnings }).toEqual({ status: 'found', warnings: [] })
		}
	})
})

describe('the plugin references', () => {
	it('every shipped reference checks clean', async () => {
		const layers = await referenceLayers({ ...base, plugin, platform: process.platform })
		const entries = checkReferences(layers)
		expect(entries.length).toBeGreaterThan(0)
		expect(entries.filter((entry) => entry.status !== 'passed' || entry.warnings.length > 0)).toEqual([])
	})
})
