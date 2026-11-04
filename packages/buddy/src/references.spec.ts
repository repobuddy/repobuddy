import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from '@jest/globals'
import { checkReferences, loadReference, referenceImplementations, referenceLayers } from 'cyber-agentkit'

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

describe('project-tracker.capabilities.interface', () => {
	const name = 'project-tracker.capabilities.interface'

	it('loads from the plugin with no warning', async () => {
		const resolved = await loadReference(name, { ...base, plugin })
		expect({ status: resolved.status, warnings: resolved.warnings }).toEqual({ status: 'found', warnings: [] })
	})

	it('lists the same sections, in order, as its Sections table', async () => {
		const resolved = await loadReference(name, { ...base, plugin })
		const iface = resolved.metadata?.['interface'] as { sections: { heading: string }[] } | undefined
		const declared = iface?.sections.map(({ heading }) => heading)
		const table = (resolved.content ?? '')
			.split('\n## Sections\n')[1]
			?.split('\n## ')[0]
			?.split('\n')
			.flatMap((line) => /^\| `([^`]+)` \|/.exec(line)?.[1] ?? [])
		expect(declared).toEqual(table)
	})

	it('is implemented by the GitHub and GitLab capabilities references, and every shipped reference checks clean', async () => {
		const layers = await referenceLayers({ ...base, plugin, platform: process.platform })
		const entries = checkReferences(layers)
		expect(entries.filter((entry) => entry.kind === 'implementation').map((entry) => entry.name)).toEqual([
			'project-tracker.capabilities.github',
			'project-tracker.capabilities.gitlab',
		])
		expect(entries.filter((entry) => entry.status !== 'passed' || entry.warnings.length > 0)).toEqual([])
		expect(
			referenceImplementations('project-tracker.capabilities', layers).implementations.map(({ pin }) => pin),
		).toEqual(['repobuddy/project-tracker.capabilities.github', 'repobuddy/project-tracker.capabilities.gitlab'])
	})

	it('ships with each skill that names it under its own name, not as a default', () => {
		const canonical = readFileSync(join(pluginRoot, 'references', `${name}.md`), 'utf8')
		for (const skill of ['epic', 'initiative', 'issue', 'project-tracker']) {
			expect(readFileSync(join(skillsDir, skill, 'references', `${name}.md`), 'utf8')).toBe(canonical)
		}
	})

	it('keeps project-tracker.contract as a stub that names the new reference', async () => {
		const resolved = await loadReference('project-tracker.contract', { ...base, plugin })
		expect(resolved.status).toBe('found')
		expect(resolved.content).toContain('`project-tracker.capabilities.interface`')
	})
})
