#!/usr/bin/env node
/**
 * Validate a public skill, its SDD spec node, and its latest ACED run — before
 * anyone reports on it.
 *
 * This exists because a passing eval is easy to over-claim. A run can be green and
 * still be worthless: it may predate the edits it supposedly covers, or its passes
 * may rest on assertions the harness cannot actually settle. Both happened while
 * building `to-question`. The checks below make those conditions loud instead of
 * leaving them to whoever is writing the summary.
 *
 *   node scripts/validate-skill.mjs <skill-name> [--deep]
 *
 * `--deep` also shells out to the SDD suite/structure checks and the skills audit,
 * which are slower and need network.
 *
 * Exit code 0 = safe to report as-is. Non-zero = do not present this as a clean result.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, join } from 'node:path'

const DESCRIPTION_MAX = 120

const skill = process.argv[2]
const deep = process.argv.includes('--deep')

if (!skill) {
	console.error('usage: node scripts/validate-skill.mjs <skill-name> [--deep]')
	process.exit(2)
}

const skillDir = join('skills', skill)
const specDir = join('.agents', 'spec', 'agent-skills', skill)
const resultsDir = join('.agents', 'aced', 'results', `skills-${skill}`)

const errors = []
const warnings = []
const notes = []

const fail = (m) => errors.push(m)
const warn = (m) => warnings.push(m)
const note = (m) => notes.push(m)

// ── the skill itself ────────────────────────────────────────────────────────

if (!existsSync(skillDir)) {
	fail(`no such skill: ${skillDir}`)
	report()
}

const skillMd = join(skillDir, 'SKILL.md')
if (!existsSync(skillMd)) fail(`missing ${skillMd}`)

const skillText = existsSync(skillMd) ? readFileSync(skillMd, 'utf8') : ''
const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(skillText)?.[1] ?? ''

const fmName = /^name:\s*(.+)$/m.exec(frontmatter)?.[1]?.trim()
if (fmName !== skill) fail(`frontmatter name "${fmName}" does not match directory "${skill}"`)

const fmDescription = /^description:\s*(.+)$/m
	.exec(frontmatter)?.[1]
	?.trim()
	.replace(/^["']|["']$/g, '')
if (!fmDescription) {
	fail('frontmatter has no description — it is the surface the harness matches against')
} else if (fmDescription.length > DESCRIPTION_MAX) {
	fail(`description is ${fmDescription.length} chars, over the ${DESCRIPTION_MAX} audit limit`)
} else {
	note(`description ${fmDescription.length}/${DESCRIPTION_MAX} chars`)
}

// ── asset fences ────────────────────────────────────────────────────────────
// A template containing ``` blocks must be wrapped in a longer fence, or it
// terminates early and the rest of the file reads as loose prose. This shipped
// broken in three files, so it is checked rather than trusted.

const assetsDir = join(skillDir, 'assets')
const assets = existsSync(assetsDir) ? readdirSync(assetsDir).filter((f) => f.endsWith('.md')) : []

for (const asset of assets) {
	const lines = readFileSync(join(assetsDir, asset), 'utf8').split('\n')
	let openLen = null
	let openLine = 0
	for (const [i, line] of lines.entries()) {
		const m = /^(`{3,})/.exec(line)
		if (!m) continue
		const len = m[1].length
		if (openLen === null) {
			openLen = len
			openLine = i + 1
		} else if (len >= openLen) {
			openLen = null
		}
	}
	if (openLen !== null) fail(`${asset}: unterminated code fence opened at line ${openLine}`)
}

// ── asset cross-references ──────────────────────────────────────────────────
// An asset the skill never references is dead weight; a reference to a missing
// file sends the agent to read something that is not there.

for (const asset of assets) {
	if (!skillText.includes(`assets/${asset}`)) warn(`${asset} exists but SKILL.md never references it`)
}
for (const ref of skillText.matchAll(/assets\/([\w.-]+\.md)/g)) {
	if (!assets.includes(ref[1])) fail(`SKILL.md references assets/${ref[1]}, which does not exist`)
}

// ── the spec node ───────────────────────────────────────────────────────────

const specReadme = join(specDir, 'README.md')
const featurePath = join(specDir, `${skill}.feature`)

if (!existsSync(specDir)) {
	warn(`no spec node at ${specDir} — the skill ships without a spec behind it`)
} else {
	if (!existsSync(specReadme)) fail(`missing ${specReadme}`)
	else {
		const specText = readFileSync(specReadme, 'utf8')
		const specFm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(specText)?.[1] ?? ''
		if (!/^spec-type:/m.test(specFm)) fail('spec node has no spec-type — its kind must be declared, never inferred')
		if (!/^concept:/m.test(specFm)) fail('spec node has no concept tag — check-spec-structure treats this as blocking')

		const open = specText.match(/<!--\s*open:/g)?.length ?? 0
		if (open > 0) note(`${open} open marker(s) — legal at draft, but they block the spec gate`)

		for (const section of ['## What', '## Use Cases', '## Control Flow', '## Scenario map']) {
			if (!specText.includes(section)) fail(`spec node is missing the required section ${section}`)
		}
	}
	if (!existsSync(featurePath)) fail(`missing ${featurePath}`)
	else if (/^\s*@frozen\b/m.test(readFileSync(featurePath, 'utf8')))
		note('suite is @frozen — narrowing it needs Clearance')
}

// ── the latest ACED run ─────────────────────────────────────────────────────
// The important question is not "did it pass" but "does this result still describe
// the files on disk, and did anything pass for a reason that does not count".

const subjectFiles = [skillMd, ...assets.map((a) => join(assetsDir, a)), featurePath].filter((p) => existsSync(p))

const runs = existsSync(resultsDir)
	? readdirSync(resultsDir)
			.filter((f) => f.endsWith('.json'))
			.sort()
	: []

if (runs.length === 0) {
	warn(`no ACED run found under ${resultsDir} — nothing has evaluated this skill`)
} else {
	const latestPath = join(resultsDir, runs.at(-1))
	let result
	try {
		result = JSON.parse(readFileSync(latestPath, 'utf8'))
	} catch (e) {
		fail(`latest ACED result is not valid JSON (${basename(latestPath)}): ${e.message}`)
	}

	if (result) {
		const runAt = new Date(result.timestamp ?? statSync(latestPath).mtime)

		// Staleness is the check that matters most: every edit after the run makes the
		// result describe a subject that no longer exists.
		const newer = subjectFiles.filter((p) => statSync(p).mtime > runAt)
		if (newer.length > 0) {
			fail(
				`ACED result ${basename(latestPath)} is STALE — ${newer.length} subject file(s) changed after it ran ` +
					`(${newer.map((p) => basename(p)).join(', ')}). Re-run before reporting it as current.`,
			)
		} else {
			note(`ACED result ${basename(latestPath)} is current`)
		}

		if (result.implementation_pass === false) {
			fail('latest ACED run has implementation_pass: false — do not present it as passing')
		}

		const failing = result.scenarios_failing ?? []
		if (failing.length > 0) fail(`${failing.length} failing scenario(s) in the latest run`)

		// A pass the judge itself would not stand behind must not be counted as evidence.
		const untrusted = result.untrusted_passes ?? []
		if (untrusted.length > 0) {
			warn(
				`${untrusted.length} pass(es) flagged untrusted by the judge — a headline pass rate that ` +
					'includes them overstates the evidence',
			)
		}

		const defects = result.suite_defects ?? []
		if (defects.length > 0)
			warn(`${defects.length} suite defect(s) recorded — these need suite fixes, not subject fixes`)

		// A scenario clearing by zero margin has not passed; it has been lucky.
		for (const s of result.scenarios_failing ?? []) {
			const agg = s.aggregate
			if (agg && typeof agg.total_mean === 'number' && typeof agg.threshold === 'number') {
				note(`${s.scenario}: mean ${agg.total_mean}/${agg.max} vs threshold ${agg.threshold}`)
			}
		}
	}
}

// ── optional: the slower external checks ────────────────────────────────────

if (deep) {
	const run = (label, file, args) => {
		try {
			const out = execFileSync(file, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
			note(`${label}: ${out.trim().split('\n').at(-1)}`)
		} catch (e) {
			fail(`${label} failed: ${(e.stdout || e.stderr || e.message).toString().trim().split('\n').at(-1)}`)
		}
	}
	const sdd = process.env.SDD_SKILLS_DIR
	if (sdd) {
		run('check-suite', 'npx', ['tsx', join(sdd, 'spec-gate/scripts/check-suite.mts'), '--spec', specReadme])
		run('check-spec-structure', 'npx', [
			'tsx',
			join(sdd, 'check-spec-structure/scripts/check-spec-structure.mts'),
			'--spec-dir',
			join(process.cwd(), '.agents', 'spec'),
			'--check',
		])
	} else {
		warn('SDD_SKILLS_DIR not set — skipped check-suite and check-spec-structure')
	}
	run('skills audit', 'npx', ['cyber-skills@0.4.3', 'audit', 'validate'])
}

report()

function report() {
	const line = '─'.repeat(60)
	console.log(`\nvalidate-skill: ${skill}\n${line}`)
	for (const n of notes) console.log(`  ·  ${n}`)
	for (const w of warnings) console.log(`  !  ${w}`)
	for (const e of errors) console.log(`  ✗  ${e}`)
	console.log(line)

	if (errors.length === 0 && warnings.length === 0) {
		console.log('OK — safe to report as-is.\n')
		process.exit(0)
	}
	if (errors.length === 0) {
		console.log(`${warnings.length} warning(s). Report the caveats explicitly; do not summarise this as clean.\n`)
		process.exit(0)
	}
	console.log(`${errors.length} error(s), ${warnings.length} warning(s). Do NOT present this as a passing result.\n`)
	process.exit(1)
}
