#!/usr/bin/env node
/**
 * Check a composed question against its target platform's markup rules.
 *
 * Slack does not accept Markdown and Jira accepts neither — a draft in the wrong
 * dialect looks completely correct right up until it is pasted, where it renders
 * as literal punctuation. This catches that before the user pastes it.
 *
 *   node scripts/check-format.mjs <target> [file]      # file, or stdin
 *
 * Targets: slack | jira | linear | github | gitlab | asana | markdown | email
 *
 * Exit 0 = clean. Exit 1 = findings. Exit 2 = bad usage.
 *
 * Content inside fenced code blocks is skipped: an ASCII diagram or a code sample
 * is allowed to contain anything, and flagging it would make the check unusable.
 */

import { existsSync, readFileSync } from 'node:fs'

const TARGETS = ['slack', 'jira', 'linear', 'github', 'gitlab', 'asana', 'markdown', 'email']

const args = process.argv.slice(2)
const json = args.includes('--json')
const [target, file] = args.filter((a) => !a.startsWith('--'))

if (!target || !TARGETS.includes(target)) {
	process.stderr.write(`usage: node scripts/check-format.mjs <${TARGETS.join('|')}> [file] [--json]\n`)
	process.exit(2)
}

const text = file
	? existsSync(file)
		? readFileSync(file, 'utf8')
		: (process.stderr.write(`no such file: ${file}\n`), process.exit(2))
	: readFileSync(0, 'utf8')

const lines = text.split('\n')
const findings = []
const add = (line, msg, fix) => findings.push({ line, msg, fix })

// ── work out which lines are inside a fence, and check the fences balance ──

const inFence = new Array(lines.length).fill(false)
{
	let openLen = null
	let openLine = 0
	for (const [i, line] of lines.entries()) {
		const m = /^\s*(`{3,})/.exec(line)
		if (m) {
			const len = m[1].length
			if (openLen === null) {
				openLen = len
				openLine = i + 1
				inFence[i] = true
				continue
			}
			if (len >= openLen) {
				openLen = null
				inFence[i] = true
				continue
			}
		}
		inFence[i] = openLen !== null
	}
	if (openLen !== null) add(openLine, 'unterminated code block', 'close the fence, or the rest renders as loose text')
}

const prose = lines.map((l, i) => (inFence[i] ? '' : l))

// ── the rule that holds on every target ───────────────────────────────────

const firstIdx = prose.findIndex((l) => l.trim() !== '')
if (firstIdx === -1) {
	add(1, 'draft is empty', 'the first line should ask the question')
} else {
	const first = prose[firstIdx].trim()
	const labelled = /^(?:#+\s*|[*_]{1,2}\s*)?(?:\p{Emoji_Presentation}\s*)?(title|summary|ask|subject|question)\s*:/iu
	if (labelled.test(first)) {
		add(
			firstIdx + 1,
			'opening line is labelled',
			'drop the label and ask the question directly — the line is the question',
		)
	}
}

// ── per-target markup rules ───────────────────────────────────────────────

const scan = (re, msg, fix, predicate) => {
	for (const [i, line] of prose.entries()) {
		if (!line) continue
		if (predicate && !predicate(line)) continue
		if (re.test(line)) add(i + 1, msg, fix)
	}
}

if (target === 'slack') {
	scan(/\*\*[^*]+\*\*/, 'double-asterisk bold', 'Slack bold is *single* asterisks')
	scan(/~~[^~]+~~/, 'double-tilde strikethrough', 'Slack strikethrough is ~single~ tildes')
	scan(/^\s*#{1,6}\s+\S/, 'Markdown heading', 'Slack has no headings — use emoji + *bold* instead')
	scan(/\[[^\]]+\]\([^)]+\)/, 'Markdown link', 'Slack links are <https://url|text>')
	scan(/^\s*\|.*\|/, 'Markdown table', 'Slack does not render tables — use a list')
	scan(/^\s*[-*]\s+\S/, 'hyphen/asterisk bullet', 'Slack mrkdwn wants • bullets')
} else if (target === 'jira') {
	scan(/\*\*[^*]+\*\*/, 'double-asterisk bold', 'Jira bold is *single* asterisks')
	scan(/~~[^~]+~~/, 'double-tilde strikethrough', 'Jira strikethrough is -single hyphens-')
	scan(/\[[^\]]+\]\([^)]+\)/, 'Markdown link', 'Jira links are [text|https://url]')
	scan(/^\s*`{3,}/, 'Markdown code fence', 'Jira uses {code} or {noformat} blocks', (l) => !/^\s*$/.test(l))
	if (!prose.some((l) => /^h[1-6]\.\s+\S/.test(l))) {
		add(1, 'no Jira headings found', 'section headings are h2. Heading, not ## Heading')
	}
} else if (target === 'linear') {
	scan(/^\s*#{5,6}\s+\S/, 'heading deeper than four levels', 'Linear renders # through #### only')
} else if (target === 'asana') {
	scan(/^\s*\|.*\|/, 'Markdown table', 'Asana does not render tables — use a list')
} else if (target === 'email') {
	if (firstIdx !== -1 && /^\s*#{1,6}\s+\S/.test(prose[firstIdx])) {
		add(
			firstIdx + 1,
			'body opens with a heading',
			'the body opens with the question; the subject goes in the Subject field',
		)
	}
	scan(
		/^\s*#{1,6}\s*subject\s*:/i,
		'subject line inside the body',
		'hand the subject over separately to type into the client',
	)
}

// ── report ────────────────────────────────────────────────────────────────
// stdout carries the result and nothing else, so a caller can parse it; --json
// makes that contract explicit for an agent reading the output.

findings.sort((a, b) => a.line - b.line)

const out = (s) => process.stdout.write(s)

if (json) {
	out(`${JSON.stringify({ target, clean: findings.length === 0, findings }, null, 2)}\n`)
} else if (findings.length === 0) {
	out(`check-format: ${target} — clean\n`)
} else {
	out(`check-format: ${target} — ${findings.length} finding(s)\n\n`)
	for (const f of findings) out(`  line ${f.line}: ${f.msg}\n    → ${f.fix}\n`)
	out('\n')
}

process.exit(findings.length === 0 ? 0 : 1)
