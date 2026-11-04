#!/usr/bin/env node
/**
 * Keeps each skill's `references/` copies equal to the canonical references in
 * `packages/buddy/references/`.
 *
 * The canonical file is the one cyber-agentkit resolves for a plugin. Skills CLI installs copy only
 * a skill's own folder, so a skill also carries a copy as its default, `references/<name>.default.md`:
 * cyber-agentkit 2 adds it below every other contribution, and the `reference` skill reads it on its
 * own when the command cannot run. A copy named `<name>.md` is not read as a default, so the sync
 * removes one. The canonical file says `extends: [default]`, so the plugin builds on the skill's
 * default instead of warning `default-not-selected`; the copy leaves that line out, since a default
 * that extends itself warns `extends-self`. A skill carries a copy of every canonical reference its `SKILL.md` names in
 * backticks. The copies are generated; edit the canonical file, then run
 * `node scripts/sync-skill-references.mjs`. With `--check` (the `verify` mode), it changes nothing
 * and fails when a copy is missing, stale, or no longer named by its skill.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const PLUGIN_ROOT = 'packages/buddy'
const CANONICAL = join(PLUGIN_ROOT, 'references')
const SKILLS = join(PLUGIN_ROOT, 'skills')
const check = process.argv.includes('--check')

const canonical = readdirSync(CANONICAL).filter((file) => file.endsWith('.md'))
/** The skill default of a canonical `<name>.md`. */
const defaultOf = (file) => `${file.slice(0, -3)}.default.md`
const EXTENDS_DEFAULT = /^---\n((?:.*\n)*?)extends: \[default\]\n/
/** A canonical file as its skill default: the same text without the frontmatter's `extends: [default]`. */
function asDefault(file) {
	const text = readFileSync(join(CANONICAL, file), 'utf-8')
	if (!EXTENDS_DEFAULT.test(text))
		problems.push(`${join(CANONICAL, file)} must say extends: [default] in its frontmatter`)
	return text.replace(EXTENDS_DEFAULT, '---\n$1')
}
const problems = []

for (const skill of readdirSync(SKILLS, { withFileTypes: true })) {
	if (!skill.isDirectory()) continue
	const skillDir = join(SKILLS, skill.name)
	const skillMd = join(skillDir, 'SKILL.md')
	if (!existsSync(skillMd)) continue
	const body = readFileSync(skillMd, 'utf-8')
	const wanted = canonical.filter((file) => body.includes(`\`${file.slice(0, -3)}`))
	const folder = join(skillDir, 'references')

	for (const file of wanted) {
		const copy = join(folder, defaultOf(file))
		const source = asDefault(file)
		const current = existsSync(copy) ? readFileSync(copy, 'utf-8') : undefined
		if (current === source) continue
		if (check) problems.push(`${copy} is ${current ? 'stale' : 'missing'}`)
		else {
			mkdirSync(folder, { recursive: true })
			writeFileSync(copy, source)
			console.log(`wrote ${copy}`)
		}
	}

	if (!existsSync(folder)) continue
	for (const file of readdirSync(folder)) {
		// A copy under the canonical name is the pre-2.0 form, which cyber-agentkit no longer reads.
		const old = canonical.includes(file)
		if (!old && !(canonical.map(defaultOf).includes(file) && !wanted.map(defaultOf).includes(file))) continue
		const copy = join(folder, file)
		if (check) problems.push(old ? `${copy} must be named ${defaultOf(file)}` : `${copy} is not named by ${skillMd}`)
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
