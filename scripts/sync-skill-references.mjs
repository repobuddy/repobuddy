#!/usr/bin/env node
/**
 * Keeps each skill's `references/` copies equal to the canonical references in
 * `packages/buddy/references/`.
 *
 * The canonical file is the one cyber-agentkit resolves for a plugin. Skills CLI installs copy only
 * a skill's own folder, so a skill also carries a copy of every canonical reference its `SKILL.md`
 * names in backticks:
 *
 * - A plain reference is copied as the skill's default, `references/<name>.default.md`.
 *   cyber-agentkit 2 adds it below every other contribution, and the `reference` skill reads it on
 *   its own when the command cannot run. The canonical file says `extends: [default]`, so the plugin
 *   builds on the default instead of warning `default-not-selected`; the copy leaves that line out,
 *   since a default that extends itself warns `extends-self`.
 * - An interface document (frontmatter `interface:`) is never composed, so a default beside the
 *   plugin's file warns `interface-not-composed`. It is copied under its own name,
 *   `references/<name>.md`, which cyber-agentkit does not read; the skill reads it itself when the
 *   interface does not load.
 *
 * A copy under the other form's file name is removed. The copies are generated; edit the canonical
 * file, then run `node scripts/sync-skill-references.mjs`. With `--check` (the `verify` mode), it
 * changes nothing and fails when a copy is missing, stale, misnamed, or no longer named by its skill.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PLUGIN_ROOT = 'packages/buddy'
const CANONICAL = join(PLUGIN_ROOT, 'references')
const SKILLS = join(PLUGIN_ROOT, 'skills')
const check = process.argv.includes('--check')

const problems = []
const EXTENDS_DEFAULT = /^---\n((?:.*\n)*?)extends: \[default\]\n/
const INTERFACE = /^---\n(?:.*\n)*?interface:\n/

/** Each canonical file's copy: its file name in a skill's `references/` and its text. */
const canonical = readdirSync(CANONICAL)
	.filter((file) => file.endsWith('.md'))
	.map((file) => {
		const name = file.slice(0, -3)
		const text = readFileSync(join(CANONICAL, file), 'utf-8')
		if (INTERFACE.test(text)) return { name, copy: file, other: `${name}.default.md`, text }
		const extendsDefault = EXTENDS_DEFAULT.test(text)
		return {
			name,
			copy: `${name}.default.md`,
			other: file,
			text: text.replace(EXTENDS_DEFAULT, '---\n$1'),
			extendsDefault,
		}
	})

for (const skill of readdirSync(SKILLS, { withFileTypes: true })) {
	if (!skill.isDirectory()) continue
	const skillDir = join(SKILLS, skill.name)
	const skillMd = join(skillDir, 'SKILL.md')
	if (!existsSync(skillMd)) continue
	const body = readFileSync(skillMd, 'utf-8')
	const wanted = canonical.filter(({ name }) => body.includes(`\`${name}`))
	const folder = join(skillDir, 'references')

	for (const { name, copy: file, text, extendsDefault } of wanted) {
		if (extendsDefault === false)
			problems.push(`${join(CANONICAL, `${name}.md`)} is a skill default, so it must say extends: [default]`)
		const copy = join(folder, file)
		const current = existsSync(copy) ? readFileSync(copy, 'utf-8') : undefined
		if (current === text) continue
		if (check) problems.push(`${copy} is ${current ? 'stale' : 'missing'}`)
		else {
			mkdirSync(folder, { recursive: true })
			writeFileSync(copy, text)
			console.log(`wrote ${copy}`)
		}
	}

	if (!existsSync(folder)) continue
	for (const file of readdirSync(folder)) {
		if (wanted.some(({ copy }) => copy === file)) continue
		const misnamed = wanted.find(({ other }) => other === file)
		if (!misnamed && !canonical.some(({ copy, other }) => copy === file || other === file)) continue
		const copy = join(folder, file)
		if (check) problems.push(misnamed ? `${copy} must be named ${misnamed.copy}` : `${copy} is not named by ${skillMd}`)
		else {
			rmSync(copy)
			console.log(`removed ${copy}`)
		}
	}
}

if (problems.length > 0) {
	console.error(`Skill reference copies are out of sync:\n${problems.map((p) => `  ${p}`).join('\n')}`)
	console.error('Run `node scripts/sync-skill-references.mjs` to fix.')
	process.exit(1)
}
