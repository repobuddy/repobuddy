/*
 * Claude Code PreToolUse hook: let read-only `gh api` and `glab api` calls through, ask for everything else.
 *
 *   node scripts/gh-api-guard.mjs        # reads the hook's JSON from stdin
 *
 * Register it on the Bash tool (see the init-buddy skill for the settings entry). For a `gh api` or `glab api`
 * command it prints a PreToolUse decision:
 *   allow  a GET request, or a GraphQL query whose body has no `mutation`
 *   ask    anything else: another method, fields that switch it to POST, `--input`, `@file` fields,
 *          pipes, substitutions, variables, unknown flags
 * Any other command gets `defer`, which leaves it to the permission rules. An `allow` here never
 * overrides a deny or ask rule; Claude Code still applies those.
 *
 * stdout: the hook's JSON decision. Exit 0 always; unreadable input prints nothing, which Claude Code
 * treats as no decision.
 */

import { readFileSync } from 'node:fs'
import { decide } from '../gh-api-guard/decide.js'

/** Turn the hook's stdin payload into the hook's stdout payload, or undefined for no decision. */
export function respond(input: string): string | undefined {
	let payload: unknown
	try {
		payload = JSON.parse(input)
	} catch {
		return undefined
	}
	const command = (payload as { tool_input?: { command?: unknown } } | null)?.tool_input?.command
	if (typeof command !== 'string') return undefined
	const verdict = decide(command)
	return JSON.stringify({
		hookSpecificOutput: {
			hookEventName: 'PreToolUse',
			permissionDecision: verdict.decision,
			permissionDecisionReason: verdict.reason,
		},
	})
}

export function main(stdin: () => string = () => readFileSync(0, 'utf8')): void {
	let input: string
	try {
		input = stdin()
	} catch {
		return
	}
	const out = respond(input)
	if (out) process.stdout.write(`${out}\n`)
}

// Resolve the entry check against the built bundle's filename, since this module runs as
// `skills/init-buddy/scripts/gh-api-guard.mjs`, not under its source name.
/* istanbul ignore next -- process.argv entrypoint guard, exercised only when the bundle runs as a child process */
if (process.argv[1]?.endsWith('gh-api-guard.mjs')) main()
