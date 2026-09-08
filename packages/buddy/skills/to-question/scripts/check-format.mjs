#!/usr/bin/env node
/**
 * Check a composed question against its target platform's markup rules.
 *
 * Slack does not accept Markdown, Jira accepts neither, and the trackers below
 * accept neither Markdown nor each other's wiki markup — a draft in the wrong
 * dialect looks completely correct right up until it is pasted, where it renders
 * as literal punctuation. This catches that before the user pastes it.
 *
 *   node scripts/check-format.mjs <target> [file]      # file, or stdin
 *
 * Targets: slack | jira | linear | github | gitlab | asana | markdown | email
 *          bugzilla | bugzilla-markdown | redmine | trac
 *
 * `bugzilla` is the plain-text mode Bugzilla ships by default, where *no* markup
 * renders; `bugzilla-markdown` is the same tracker with Markdown mode switched on.
 * The mode is a property of the instance and the comment, not of the platform, so
 * the caller has to say which one it composed for.
 *
 * Exit 0 = clean. Exit 1 = findings. Exit 2 = bad usage.
 *
 * Verbatim regions are skipped: an ASCII diagram or a code sample is allowed to
 * contain anything, and flagging it would make the check unusable. Which lines
 * count as verbatim is dialect-specific — a ``` fence on the Markdown-family
 * targets, {code}/{noformat} on Jira, <pre> on Redmine, {{{ }}} on Trac, and a
 * four-space indent on plain-text Bugzilla, which has no delimiter at all.
 */

import { existsSync, readFileSync } from 'node:fs'

const TARGETS = [
	'slack',
	'jira',
	'linear',
	'github',
	'gitlab',
	'asana',
	'markdown',
	'email',
	'bugzilla',
	'bugzilla-markdown',
	'redmine',
	'trac',
]

// The dialects that delimit preformatted text with a ``` fence. Everywhere else a
// fence is itself a finding, so the dialect's own delimiter does the skipping and
// the fence stays visible to the per-target rules.
const MARKDOWN_FENCE = new Set([
	'slack',
	'linear',
	'github',
	'gitlab',
	'asana',
	'markdown',
	'email',
	'bugzilla-markdown',
])

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

// ── work out which lines are verbatim, and check the delimiters balance ───

const verbatim = new Array(lines.length).fill(false)

if (MARKDOWN_FENCE.has(target)) {
	let openLen = null
	let openLine = 0
	for (const [i, line] of lines.entries()) {
		const m = /^\s*(`{3,})/.exec(line)
		if (m) {
			const len = m[1].length
			if (openLen === null) {
				openLen = len
				openLine = i + 1
				verbatim[i] = true
				continue
			}
			if (len >= openLen) {
				openLen = null
				verbatim[i] = true
				continue
			}
		}
		verbatim[i] = openLen !== null
	}
	if (openLen !== null) add(openLine, 'unterminated code block', 'close the fence, or the rest renders as loose text')
} else if (target === 'jira') {
	// {code} and {noformat} are the same token opening and closing, so toggle.
	let open = false
	let openLine = 0
	for (const [i, line] of lines.entries()) {
		if (/^\s*\{(?:code|noformat)(?::[^}]*)?\}/.test(line)) {
			if (!open) openLine = i + 1
			open = !open
			verbatim[i] = true
			continue
		}
		verbatim[i] = open
	}
	if (open) add(openLine, 'unterminated {code} or {noformat} block', 'close it, or the rest renders as loose text')
} else if (target === 'redmine') {
	let open = false
	let openLine = 0
	for (const [i, line] of lines.entries()) {
		const opens = /<pre\b/i.test(line)
		const closes = /<\/pre>/i.test(line)
		if (opens && !open) {
			openLine = i + 1
			open = true
			verbatim[i] = true
			if (closes) open = false
			continue
		}
		if (closes && open) {
			open = false
			verbatim[i] = true
			continue
		}
		verbatim[i] = open
	}
	if (open) add(openLine, 'unterminated <pre> block', 'close it with </pre>, or the rest renders as loose text')
} else if (target === 'trac') {
	let depth = 0
	let openLine = 0
	for (const [i, line] of lines.entries()) {
		if (/^\s*\{\{\{/.test(line)) {
			if (depth === 0) openLine = i + 1
			depth += 1
			verbatim[i] = true
			continue
		}
		if (/^\s*\}\}\}/.test(line)) {
			if (depth > 0) depth -= 1
			verbatim[i] = true
			continue
		}
		verbatim[i] = depth > 0
	}
	if (depth > 0) add(openLine, 'unterminated {{{ block', 'close it with }}}, or the rest renders as loose text')
} else if (target === 'bugzilla') {
	// Plain text has no delimiter. A four-space indent is what the template uses to
	// hold a diagram together, so that is what the checker treats as verbatim.
	for (const [i, line] of lines.entries()) verbatim[i] = /^ {4,}\S/.test(line)
}

const prose = lines.map((l, i) => (verbatim[i] ? '' : l))

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
	scan(/^\s*`{3,}/, 'Markdown code fence', 'Jira uses {code} or {noformat} blocks')
	if (!prose.some((l) => /^h[1-6]\.\s+\S/.test(l))) {
		add(1, 'no Jira headings found', 'section headings are h2. Heading, not ## Heading')
	}
} else if (target === 'linear') {
	scan(/^\s*#{5,6}\s+\S/, 'heading deeper than four levels', 'Linear renders # through #### only')
} else if (target === 'asana') {
	scan(/^\s*\|.*\|/, 'Markdown table', 'Asana does not render tables — use a list')
} else if (target === 'bugzilla') {
	// Plain-text mode: every markup family is wrong here, so reject all of them.
	// Underscores are deliberately not flagged — snake_case identifiers are common
	// in a bug comment and would drown the report in false positives.
	scan(/\*\*[^*]+\*\*/, 'Markdown bold', 'plain-text Bugzilla renders the asterisks literally — drop them')
	scan(
		/(?<!\*)\*[A-Za-z0-9][^*]*[A-Za-z0-9]\*(?!\*)/,
		'single-asterisk bold',
		'plain text has no bold — drop the asterisks',
	)
	scan(/~~?[^~\s][^~]*~/, 'strikethrough markup', 'plain text has no strikethrough — say it in words')
	scan(/^\s*#{1,6}\s+\S/, 'Markdown heading', 'use a CAPITALISED label on its own line')
	scan(/^\s*h[1-6]\.\s+\S/, 'wiki heading', 'use a CAPITALISED label on its own line')
	scan(/^\s*={1,6}\s+.*=\s*$/, 'wiki heading', 'use a CAPITALISED label on its own line')
	scan(/^\s*[-*+•]\s+\S/, 'bullet marker', 'plain text has no bullets — indent the item two spaces instead')
	scan(/`/, 'backtick', 'plain text has no code formatting — indent the block four spaces instead')
	scan(/'''/, 'Trac bold', 'plain text has no bold — drop the quotes')
	scan(/\[[^\]]+\]\([^)]+\)/, 'Markdown link', 'paste the bare URL — Bugzilla auto-links it')
	scan(/\[[^\]]+\|[^\]]+\]/, 'wiki link', 'paste the bare URL — Bugzilla auto-links it')
	scan(/^\s*\|/, 'table row', 'plain text has no tables — use labelled lines')
	if (!prose.some((l) => /^[A-Z][A-Z0-9 /()'-]{2,}$/.test(l.trim()))) {
		add(1, 'no plain-text section labels found', 'sections are CAPITALISED labels on their own line, not headings')
	}
} else if (target === 'bugzilla-markdown') {
	scan(/!\[[^\]]*\]\([^)]*\)/, 'inline image', 'Bugzilla strips images — link the attachment instead')
	scan(/<\/?(?!https?:)[a-zA-Z][^>]*>/, 'inline HTML', 'Bugzilla strips HTML — use Markdown or drop it')
} else if (target === 'redmine') {
	scan(/\*\*[^*]+\*\*/, 'double-asterisk bold', 'Textile bold is *single* asterisks')
	scan(/~~[^~]+~~/, 'double-tilde strikethrough', 'Textile strikethrough is -single hyphens-')
	scan(/\[[^\]]+\]\([^)]+\)/, 'Markdown link', 'Textile links are "text":https://url')
	scan(/^\s*`{3,}/, 'Markdown code fence', 'Textile uses <pre> blocks')
	if (!prose.some((l) => /^h[1-6]\.\s+\S/.test(l))) {
		add(1, 'no Textile headings found', 'section headings are h2. Heading — in Textile, # starts a numbered list')
	}
} else if (target === 'trac') {
	scan(/\*\*[^*]+\*\*/, 'double-asterisk bold', "Trac bold is '''three quotes'''")
	scan(/^\s*#{1,6}\s+\S/, 'Markdown heading', 'Trac headings are = Heading =')
	scan(/\[[^\]]+\]\([^)]+\)/, 'Markdown link', 'Trac links are [https://url Link Text] — URL first, label second')
	scan(/^\s*`{3,}/, 'Markdown code fence', 'Trac uses {{{ }}} blocks')
	scan(/^\s*\|(?!\|)/, 'single-pipe table row', 'Trac wraps every cell in ||, including the outer edges')
	scan(/^[-*]\s+\S/, 'list item with no leading space', 'Trac lists need a leading space: " * item"')
	if (!prose.some((l) => /^\s*={1,6}\s+\S/.test(l))) {
		add(1, 'no Trac headings found', 'section headings are = Heading = or == Heading ==')
	}
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
