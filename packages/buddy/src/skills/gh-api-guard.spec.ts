import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { main, respond } from './gh-api-guard.js'

const hook = (command: unknown) =>
	JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command } })
const decisionOf = (out: string | undefined) => JSON.parse(out as string).hookSpecificOutput

let stdout: string[]

beforeEach(() => {
	stdout = []
	jest.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
		stdout.push(String(chunk))
		return true
	})
})

afterEach(() => {
	jest.restoreAllMocks()
})

test('answers with the PreToolUse output contract', () => {
	expect(JSON.parse(respond(hook('gh api user')) as string)).toEqual({
		hookSpecificOutput: {
			hookEventName: 'PreToolUse',
			permissionDecision: 'allow',
			permissionDecisionReason: 'gh api guard: read-only GET request',
		},
	})
})

test('asks for a write and defers unrelated commands', () => {
	expect(decisionOf(respond(hook('gh api -X DELETE repos/o/r'))).permissionDecision).toBe('ask')
	expect(decisionOf(respond(hook('git status'))).permissionDecision).toBe('defer')
})

test('gives no decision for input it cannot read', () => {
	expect(respond('not json')).toBeUndefined()
	expect(respond('null')).toBeUndefined()
	expect(respond(hook(42))).toBeUndefined()
})

test('main writes the decision to stdout', () => {
	main(() => hook('gh api user'))
	expect(decisionOf(stdout.join('')).permissionDecision).toBe('allow')
})

test('main prints nothing when stdin cannot be read or parsed', () => {
	main(() => {
		throw new Error('EAGAIN')
	})
	main(() => '')
	expect(stdout).toEqual([])
})
