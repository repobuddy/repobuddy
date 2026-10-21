#!/usr/bin/env node
/**
 * Keeps each skill's `references/` copies equal to the canonical references in
 * `packages/buddy/references/`.
 *
 * The canonical file is the one cyber-agentkit resolves for a plugin. Skills CLI installs copy only
 * a skill's own folder, so a skill also carries a copy, which the `reference` skill reads when the
 * command cannot run. A skill carries a copy of every canonical reference its `SKILL.md` names in
 * backticks. The copies are generated; edit the canonical file, then run
 * `node scripts/sync-skill-references.mjs`. With `--check` (the `verify` mode), it changes nothing
 * and fails when a copy is missing, stale, or no longer named by its skill.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const PLUGIN_ROOT = 'packages/buddy'
const CANONICAL = join(PLUGIN_ROOT, 'references')
const SKILLS = join(PLUGIN_ROOT, 'skills')
const check = process.argv.includes('--check')

const canonical = readdirSync(CANONICAL).filter((file) => file.endsWith('.md'))
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
		const copy = join(folder, file)
		const source = readFileSync(join(CANONICAL, file))
		const current = existsSync(copy) ? readFileSync(copy) : undefined
		if (current?.equals(source)) continue
		if (check) problems.push(`${copy} is ${current ? 'stale' : 'missing'}`)
		else {
			mkdirSync(folder, { recursive: true })
			copyFileSync(join(CANONICAL, file), copy)
			console.log(`wrote ${copy}`)
		}
	}

	if (!existsSync(folder)) continue
	for (const file of readdirSync(folder)) {
		if (!canonical.includes(file) || wanted.includes(file)) continue
		const copy = join(folder, file)
		if (check) problems.push(`${copy} is not named by ${skillMd}`)
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
