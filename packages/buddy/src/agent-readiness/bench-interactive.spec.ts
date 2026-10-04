import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from '@jest/globals'
import type { MuxAdapter, MuxOpenOptions } from 'cyber-mux'
import { type BenchConfig, BenchError } from './bench.js'
import {
	awaitCompletion,
	type CompletionClock,
	detectMux,
	findTranscript,
	interactiveArgs,
	interactiveRunner,
	launchScript,
	measuringSettings,
	parseTranscript,
	readTranscripts,
	runSession,
	type SessionProbe,
	sessionAuth,
	sessionFiles,
	sessionState,
	shellQuote,
} from './bench-interactive.js'

const dirs: string[] = []
function tmp() {
	const dir = mkdtempSync(join(tmpdir(), 'bench-interactive-spec-'))
	dirs.push(dir)
	return dir
}
afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

const config: BenchConfig = {
	model: 'sonnet',
	runs: 1,
	maxBudgetUsd: 0.5,
	permissionMode: 'bypassPermissions',
	timeoutMinutes: 20,
	tasks: [{ id: 'a', prompt: "fix it, don't ask", check: 'true' }],
}
const task = config.tasks[0]!

const usage = (input: number, output: number, read: number, write: number) => ({
	input_tokens: input,
	output_tokens: output,
	cache_read_input_tokens: read,
	cache_creation_input_tokens: write,
	service_tier: 'standard',
})

/** Shaped on a real Claude Code transcript: one line per content block, sharing the response's id and usage. */
const MAIN = [
	{ type: 'user', message: { role: 'user', content: 'fix it' } },
	{
		type: 'assistant',
		message: { id: 'msg_1', content: [{ type: 'thinking' }], usage: usage(2, 348, 60109, 10473) },
	},
	{
		type: 'assistant',
		message: { id: 'msg_1', content: [{ type: 'tool_use', id: 'toolu_1' }], usage: usage(2, 348, 60109, 10473) },
	},
	{
		type: 'assistant',
		message: { id: 'msg_1', content: [{ type: 'tool_use', id: 'toolu_2' }], usage: usage(2, 348, 60109, 10473) },
	},
	{ type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'toolu_1' }] } },
	{ type: 'assistant', message: { id: 'msg_2', content: [{ type: 'text' }], usage: usage(3, 50, 70000, 400) } },
]
	.map((e) => JSON.stringify(e))
	.concat([
		'not json',
		'{broken',
		JSON.stringify({ type: 'assistant' }),
		// What Claude Code writes for an API error, such as a rejected credential.
		JSON.stringify({
			type: 'assistant',
			isApiErrorMessage: true,
			message: { id: 'e1', model: '<synthetic>', content: [{ type: 'text' }], usage: usage(0, 0, 0, 0) },
		}),
	])
	.join('\n')

const SUBAGENT = JSON.stringify({
	type: 'assistant',
	isSidechain: true,
	message: { id: 'msg_s', content: [{ type: 'tool_use', id: 'toolu_s' }], usage: usage(10, 20, 30, 40) },
})

describe('parseTranscript', () => {
	it('counts each response once, sums its usage, and counts tool calls by id', () => {
		expect(parseTranscript(MAIN)).toEqual({
			inputTokens: 5,
			outputTokens: 398,
			cacheReadTokens: 130109,
			cacheCreationTokens: 10873,
			turns: 2,
			toolCalls: 2,
		})
	})

	it("adds the subagents' transcripts", () => {
		expect(parseTranscript(MAIN, SUBAGENT)).toMatchObject({ inputTokens: 15, turns: 3, toolCalls: 3 })
	})

	it('reads nothing as zero', () => {
		expect(parseTranscript()).toEqual({
			inputTokens: 0,
			outputTokens: 0,
			cacheReadTokens: 0,
			cacheCreationTokens: 0,
			turns: 0,
			toolCalls: 0,
		})
	})

	it('falls back to the line uuid and a positional tool id', () => {
		const line = JSON.stringify({
			type: 'assistant',
			uuid: 'u1',
			message: { content: [{ type: 'tool_use' }, { type: 'tool_use' }], usage: usage(1, 1, 0, 0) },
		})
		expect(parseTranscript(line)).toMatchObject({ turns: 1, toolCalls: 2 })
	})
})

describe('readTranscripts', () => {
	it('reads the main transcript and its subagents, and nothing when it is missing', () => {
		const dir = tmp()
		const main = join(dir, 'sess.jsonl')
		writeFileSync(main, MAIN)
		mkdirSync(join(dir, 'sess', 'subagents'), { recursive: true })
		writeFileSync(join(dir, 'sess', 'subagents', 'agent-1.jsonl'), SUBAGENT)
		writeFileSync(join(dir, 'sess', 'subagents', 'notes.txt'), 'x')
		expect(readTranscripts(main)).toEqual([MAIN, SUBAGENT])
		expect(readTranscripts(join(dir, 'none.jsonl'))).toEqual([])
		writeFileSync(join(dir, 'solo.jsonl'), MAIN)
		expect(readTranscripts(join(dir, 'solo.jsonl'))).toEqual([MAIN])
	})
})

describe('findTranscript', () => {
	it("finds the session's transcript under projects/", () => {
		const dir = tmp()
		expect(findTranscript(dir, 's1')).toBeUndefined()
		mkdirSync(join(dir, 'projects', '-tmp-a'), { recursive: true })
		mkdirSync(join(dir, 'projects', '-tmp-b'), { recursive: true })
		writeFileSync(join(dir, 'projects', '-tmp-b', 's1.jsonl'), '')
		expect(findTranscript(dir, 's1')).toBe(join(dir, 'projects', '-tmp-b', 's1.jsonl'))
		expect(findTranscript(dir, 's2')).toBeUndefined()
	})
})

/** A clock that advances only when the runner sleeps, and a probe scripted per poll. */
function fakeClock(): CompletionClock & { slept: number[] } {
	let t = 0
	const slept: number[] = []
	return {
		slept,
		now: () => t,
		sleep: (ms) => {
			slept.push(ms)
			t += ms
		},
	}
}
function scripted(
	polls: Array<Partial<{ stopped: boolean; failed: boolean; cost: number; alive: boolean }>>,
): SessionProbe {
	let i = 0
	const at = () => polls[Math.min(i, polls.length - 1)] ?? {}
	return {
		stopped: () => at().stopped ?? false,
		failed: () => at().failed ?? false,
		costUsd: () => at().cost,
		alive: () => {
			const alive = at().alive ?? true
			i++
			return alive
		},
	}
}

describe('awaitCompletion', () => {
	const bounds = { timeoutMs: 5000, maxBudgetUsd: 0.5, pollMs: 1000 }

	it('returns done once the Stop hook has fired', () => {
		const clock = fakeClock()
		expect(awaitCompletion(scripted([{}, { cost: 0.1 }, { stopped: true }]), bounds, clock)).toBe('done')
		expect(clock.slept).toEqual([1000, 1000])
	})

	it('returns failed once the StopFailure hook has fired', () => {
		expect(awaitCompletion(scripted([{}, { failed: true, cost: 9 }]), bounds, fakeClock())).toBe('failed')
	})

	it('stops a session that reaches the spend cap', () => {
		expect(awaitCompletion(scripted([{ cost: 0.2 }, { cost: 0.5 }]), bounds, fakeClock())).toBe('capped')
	})

	it('prefers done over a cap reached in the same poll', () => {
		expect(awaitCompletion(scripted([{ stopped: true, cost: 9 }]), bounds, fakeClock())).toBe('done')
	})

	it('notices a pane that closed on its own', () => {
		expect(awaitCompletion(scripted([{}, { alive: false }]), bounds, fakeClock())).toBe('exited')
	})

	it('times out at the deadline', () => {
		const clock = fakeClock()
		expect(awaitCompletion(scripted([{}]), bounds, clock)).toBe('timeout')
		expect(clock.slept).toHaveLength(5)
	})

	it('polls every second by default', () => {
		const clock = fakeClock()
		awaitCompletion(scripted([{}, { stopped: true }]), { timeoutMs: 5000, maxBudgetUsd: 1 }, clock)
		expect(clock.slept).toEqual([1000])
	})
})

describe('sessionAuth', () => {
	it('takes an OAuth token first, then an API key, and refuses without either', () => {
		expect(sessionAuth({ CLAUDE_CODE_OAUTH_TOKEN: 't', ANTHROPIC_API_KEY: 'k' })).toEqual({
			CLAUDE_CODE_OAUTH_TOKEN: 't',
		})
		expect(sessionAuth({ ANTHROPIC_API_KEY: 'k' })).toEqual({ ANTHROPIC_API_KEY: 'k' })
		expect(() => sessionAuth({})).toThrow(BenchError)
		expect(() => sessionAuth({})).toThrow(/claude setup-token/)
	})
})

describe('detectMux', () => {
	const noExec = () => null

	it('refuses when there is no multiplexer', () => {
		expect(() => detectMux({ CYBER_MUX: 'none' }, noExec)).toThrow(/none was found: run the bench from inside tmux/)
	})

	it('names a multiplexer it cannot drive', () => {
		expect(() => detectMux({ CYBER_MUX: 'screen' }, noExec)).toThrow(/--runner interactive: .*GNU Screen/)
	})

	it('resolves tmux and herdr', () => {
		expect(detectMux({ CYBER_MUX: 'tmux' }, noExec).name).toBe('tmux')
		expect(detectMux({ CYBER_MUX: 'herdr' }, noExec).name).toBe('herdr')
	})
})

describe('interactiveRunner', () => {
	it('refuses up front without a credential', () => {
		expect(() => interactiveRunner({ CYBER_MUX: 'tmux' }, () => null)).toThrow(/CLAUDE_CODE_OAUTH_TOKEN/)
	})

	it('is named interactive', () => {
		const runner = interactiveRunner({ CYBER_MUX: 'tmux', CLAUDE_CODE_OAUTH_TOKEN: 't' }, () => null)
		expect(runner.name).toBe('interactive')
		expect(runner.now()).toBeGreaterThan(0)
	})
})

describe('session setup', () => {
	it('quotes anything for sh', () => {
		const nasty = `it's "$HOME" \`x\`\n\\ end`
		expect(spawnSync('sh', ['-c', `printf %s ${shellQuote(nasty)}`], { encoding: 'utf8' }).stdout).toBe(nasty)
	})

	it('trusts the checkout, and pre-approves an API key', () => {
		expect(sessionState('/c', { CLAUDE_CODE_OAUTH_TOKEN: 't' })).toEqual({
			hasCompletedOnboarding: true,
			bypassPermissionsModeAccepted: true,
			projects: { '/c': { hasTrustDialogAccepted: true, hasCompletedProjectOnboarding: true } },
		})
		const key = `sk-ant-${'x'.repeat(10)}${'k'.repeat(20)}`
		expect(sessionState('/c', { ANTHROPIC_API_KEY: key }).customApiKeyResponses).toEqual({
			approved: ['k'.repeat(20)],
			rejected: [],
		})
	})

	it('adds the measuring hook and status line', () => {
		const settings = measuringSettings(sessionFiles("/t/it's"))
		expect(settings.hooks.Stop[0]?.hooks[0]?.command).toBe(`cat > '/t/it'\\''s/stop.json'`)
		expect(settings.hooks.StopFailure[0]?.hooks[0]?.command).toBe(`cat > '/t/it'\\''s/stop-failure.json'`)
		expect(settings.statusLine.command).toBe(`cat > '/t/it'\\''s/status.json'`)
	})

	it('passes the -p isolation flags, and the MCP config only when the checkout has one', () => {
		const checkout = tmp()
		const files = sessionFiles('/s')
		const args = interactiveArgs(config, task, checkout, files, 'id-1')
		expect(args).toEqual([
			'--session-id',
			'id-1',
			'--model',
			'sonnet',
			'--permission-mode',
			'bypassPermissions',
			'--setting-sources',
			'project',
			'--strict-mcp-config',
			'--settings',
			'/s/settings.json',
			'--',
			task.prompt,
		])
		writeFileSync(join(checkout, '.mcp.json'), '{}')
		expect(interactiveArgs(config, task, checkout, files, 'id-1')).toContain('.mcp.json')
	})

	it('launches claude with only the isolated config and the credential', () => {
		const dir = tmp()
		const bin = join(dir, 'bin')
		mkdirSync(bin)
		// A stand-in `claude` that reports what it was started with.
		writeFileSync(
			join(bin, 'claude'),
			'#!/bin/sh\nenv | grep -E "^(CLAUDE|DISABLE_AUTOUPDATER)" | sort\nfor a in "$@"; do echo "arg:$a"; done\n',
		)
		chmodSync(join(bin, 'claude'), 0o755)
		const files = sessionFiles(join(dir, 'sess'))
		const script = launchScript(files, { CLAUDE_CODE_OAUTH_TOKEN: "t'ok" }, ['--', "it's\nmultiline"])
		const out = spawnSync('sh', ['-c', script], {
			encoding: 'utf8',
			env: { PATH: `${bin}:/usr/bin:/bin`, CLAUDECODE: '1', CLAUDE_CODE_SESSION_ID: 'parent', CLAUDE_X: 'y' },
		}).stdout
		expect(out).toBe(
			[
				`CLAUDE_CODE_OAUTH_TOKEN=t'ok`,
				`CLAUDE_CONFIG_DIR=${files.configDir}`,
				'DISABLE_AUTOUPDATER=1',
				'arg:--',
				"arg:it's",
				'multiline',
				'',
			].join('\n'),
		)
	})
})

type FakeMux = MuxAdapter & { opened: MuxOpenOptions[]; torn: string[] }

/**
 * Stands in for a multiplexer and the session in it: opening the pane "runs" the session, which is to
 * say it writes what the Stop hook and status line would have, per `behave`.
 */
function fakeMux(behave: {
	stop?: boolean
	cost?: number
	transcript?: boolean
	alive?: boolean
	openFails?: boolean
	failure?: unknown
}): FakeMux {
	const opened: MuxOpenOptions[] = []
	const torn: string[] = []
	const mux = {
		opened,
		torn,
		open(_exec, opts) {
			if (behave.openFails) throw new Error('no space')
			opened.push(opts)
			const launch = /^sh '(.*)'$/.exec(opts.launch ?? '')?.[1] as string
			const dir = dirname(launch)
			const session = /'--session-id' '([^']+)'/.exec(readFileSync(launch, 'utf8'))?.[1]
			const transcript = join(dir, 'config', 'projects', '-c', `${session}.jsonl`)
			if (behave.transcript !== false) {
				mkdirSync(dirname(transcript), { recursive: true })
				writeFileSync(transcript, MAIN)
			}
			if (behave.cost !== undefined)
				writeFileSync(join(dir, 'status.json'), JSON.stringify({ cost: { total_cost_usd: behave.cost } }))
			if (behave.failure !== undefined)
				writeFileSync(
					join(dir, 'stop-failure.json'),
					JSON.stringify({ transcript_path: transcript, ...(behave.failure ? { error: behave.failure } : {}) }),
				)
			else if (behave.stop !== false)
				writeFileSync(join(dir, 'stop.json'), JSON.stringify({ transcript_path: transcript }))
			return { id: 'p1', tab: 't1' }
		},
		paneExists: () => behave.alive ?? true,
		teardown(_exec, target) {
			torn.push(target.id)
		},
	} as Partial<FakeMux>
	return mux as FakeMux
}

describe('runSession', () => {
	const env = { CLAUDE_CODE_OAUTH_TOKEN: 't' }
	const run = (mux: FakeMux, timeoutMs = 3000) =>
		runSession(config, task, tmp(), timeoutMs, {
			exec: () => null,
			mux,
			env,
			clock: fakeClock(),
			pollMs: 1000,
			settleMs: 0,
		})

	it('opens a pane, reads the transcript and cost, and closes the pane', () => {
		const mux = fakeMux({ cost: 0.12 })
		const r = run(mux)
		expect(r).toMatchObject({ turns: 2, toolCalls: 2, inputTokens: 5, costUsd: 0.12, capped: false })
		expect(r.error).toBeUndefined()
		expect(r.transcript).toBe(`${MAIN}\n`)
		expect(mux.opened[0]).toMatchObject({ at: 'workspace', label: 'bench a' })
		expect(mux.torn).toEqual(['p1'])
		const launch = /^sh '(.*)'$/.exec(mux.opened[0]?.launch ?? '')?.[1] as string
		expect(existsSync(dirname(launch))).toBe(false)
	})

	it('stops a session over its budget and marks it capped', () => {
		const mux = fakeMux({ stop: false, cost: 0.9 })
		expect(run(mux)).toMatchObject({ capped: true, costUsd: 0.9, turns: 2 })
		expect(mux.torn).toEqual(['p1'])
	})

	it('stops a session at the timeout, finding the transcript by session id', () => {
		const mux = fakeMux({ stop: false, cost: 0.1 })
		expect(run(mux)).toMatchObject({ capped: true, turns: 2 })
		expect(mux.torn).toEqual(['p1'])
	})

	it('reads no metrics when there is no transcript', () => {
		const r = run(fakeMux({ stop: false, cost: 0.1, transcript: false }))
		expect(r).toMatchObject({ capped: true, turns: 0 })
		expect(r).not.toHaveProperty('transcript')
	})

	it('reports a session whose pane closed before the agent finished', () => {
		const r = run(fakeMux({ stop: false, alive: false, cost: 0.01 }))
		expect(r).toMatchObject({ capped: true, error: 'the session closed before the agent finished' })
	})

	it('ends a session whose turn failed on an API error, with the error when the hook names it', () => {
		expect(run(fakeMux({ failure: 'authentication_failed', cost: 0 }))).toMatchObject({
			capped: true,
			turns: 2,
			error: `the agent's turn failed on an API error: "authentication_failed"`,
		})
		expect(run(fakeMux({ failure: false, cost: 0 })).error).toBe("the agent's turn failed on an API error")
	})

	it('says when no cost was reported, since the cap could not hold', () => {
		expect(run(fakeMux({})).error).toBe('the session reported no cost, so the spend cap was not enforced')
	})

	it('reports a pane that would not open', () => {
		const mux = fakeMux({ openFails: true })
		expect(run(mux)).toMatchObject({ error: 'could not open a pane: no space', costUsd: 0, capped: false })
		expect(mux.torn).toEqual([])
	})
})
