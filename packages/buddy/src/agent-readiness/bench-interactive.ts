/**
 * The interactive bench runner: each run is a real Claude Code session in a terminal multiplexer
 * pane, the way agents are used day to day, instead of headless `claude -p`.
 *
 * The pane is driven through cyber-mux, so any multiplexer it supports works (tmux, herdr, and
 * others); without one the runner refuses before anything runs. Each session gets a fresh
 * `CLAUDE_CONFIG_DIR`, so none of the operator's global instructions, plugins, skills, settings, or
 * MCP servers load: only the checkout's own, as with `-p`. A fresh config directory has no login, so
 * the session authenticates with `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` from the
 * environment; the runner never reads or copies the operator's stored credentials.
 *
 * There is no `-p` result event, so the runner measures through two settings of its own, passed with
 * `--settings`, which add nothing to the model's context:
 * - a Stop hook writes its input to a file when the agent finishes its turn: the completion signal,
 *   and the path of the session transcript that tokens, turns, and tool calls are read from; a
 *   StopFailure hook does the same when the turn ends on an API error, which fires no Stop;
 * - a status line writes its input to a file on every update: Claude Code's own running cost, which
 *   enforces the per-run spend cap and is the run's recorded cost.
 */

import { randomUUID } from 'node:crypto'
import {
	chmodSync,
	existsSync,
	mkdirSync,
	mkdtempSync,
	readdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { type Exec, type MuxAdapter, type MuxTarget, nodeExec, probeMultiplexer, resolveMuxAdapter } from 'cyber-mux'
import {
	type AgentRun,
	type BenchConfig,
	BenchError,
	type BenchTask,
	hostShell,
	type RunMetrics,
	type Runner,
} from './bench.js'

/** Token counts, turns, and tool calls read from a session transcript. Cost comes from elsewhere. */
export type TranscriptMetrics = Omit<RunMetrics, 'costUsd' | 'capped'>

interface TranscriptEntry {
	type?: string
	uuid?: string
	message?: {
		id?: string
		model?: string
		usage?: {
			input_tokens?: number
			output_tokens?: number
			cache_read_input_tokens?: number
			cache_creation_input_tokens?: number
		}
		content?: Array<{ type?: string; id?: string }> | string
	}
}

/**
 * Reads Claude Code session transcripts (JSONL): the main session's, plus any of its subagents'.
 *
 * Claude Code writes one line per content block, so one model response can span several lines that
 * share a `message.id` and repeat its usage. Each response is counted once: a turn is one model
 * response, and its tokens are the usage on its last line. A tool call is a `tool_use` block, counted
 * by its id. The `<synthetic>` message Claude Code writes for an API error is not a response.
 */
export function parseTranscript(...texts: string[]): TranscriptMetrics {
	const usage = new Map<string, NonNullable<NonNullable<TranscriptEntry['message']>['usage']>>()
	const tools = new Set<string>()
	for (const text of texts) {
		for (const line of text.split('\n')) {
			if (!line.startsWith('{')) continue
			let entry: TranscriptEntry
			try {
				entry = JSON.parse(line)
			} catch {
				continue
			}
			// Claude Code records an API error as a `<synthetic>` response: no model call, so not a turn.
			if (entry.type !== 'assistant' || !entry.message || entry.message.model === '<synthetic>') continue
			const id = entry.message.id ?? entry.uuid
			if (id !== undefined && entry.message.usage) usage.set(id, entry.message.usage)
			const content = Array.isArray(entry.message.content) ? entry.message.content : []
			for (const block of content) {
				if (block.type === 'tool_use') tools.add(block.id ?? `${id}:${tools.size}`)
			}
		}
	}
	const metrics: TranscriptMetrics = {
		inputTokens: 0,
		outputTokens: 0,
		cacheReadTokens: 0,
		cacheCreationTokens: 0,
		turns: usage.size,
		toolCalls: tools.size,
	}
	for (const u of usage.values()) {
		metrics.inputTokens += u.input_tokens ?? 0
		metrics.outputTokens += u.output_tokens ?? 0
		metrics.cacheReadTokens += u.cache_read_input_tokens ?? 0
		metrics.cacheCreationTokens += u.cache_creation_input_tokens ?? 0
	}
	return metrics
}

/** The main transcript and its subagents' (`<session-id>/subagents/*.jsonl` beside it). */
export function readTranscripts(transcriptPath: string): string[] {
	if (!existsSync(transcriptPath)) return []
	const texts = [readFileSync(transcriptPath, 'utf8')]
	const subagents = join(dirname(transcriptPath), basename(transcriptPath, '.jsonl'), 'subagents')
	if (existsSync(subagents)) {
		for (const name of readdirSync(subagents).sort()) {
			if (name.endsWith('.jsonl')) texts.push(readFileSync(join(subagents, name), 'utf8'))
		}
	}
	return texts
}

/** How a session ended: the agent finished, its turn failed on an API error, or the runner stopped it. */
export type Completion = 'done' | 'failed' | 'capped' | 'timeout' | 'exited'

/** What the runner can observe of a running session. */
export interface SessionProbe {
	/** The Stop hook has fired: the agent finished its turn. */
	stopped(): boolean
	/** The StopFailure hook has fired: the turn ended on an API error. */
	failed(): boolean
	/** Claude Code's running cost for the session, once its status line has reported one. */
	costUsd(): number | undefined
	/** The pane is still open. */
	alive(): boolean
}

export interface CompletionClock {
	now(): number
	sleep(ms: number): void
}

export interface CompletionBounds {
	timeoutMs: number
	maxBudgetUsd: number
	pollMs?: number
}

/**
 * Polls a session until it ends. The turn ending, by Stop or StopFailure, wins over a bound hit in the
 * same poll; after that the spend cap, a pane that closed on its own, and the timeout, in that order.
 */
export function awaitCompletion(probe: SessionProbe, bounds: CompletionBounds, clock: CompletionClock): Completion {
	const deadline = clock.now() + bounds.timeoutMs
	for (;;) {
		if (probe.stopped()) return 'done'
		if (probe.failed()) return 'failed'
		if ((probe.costUsd() ?? 0) >= bounds.maxBudgetUsd) return 'capped'
		if (!probe.alive()) return 'exited'
		if (clock.now() >= deadline) return 'timeout'
		clock.sleep(bounds.pollMs ?? 1000)
	}
}

/** The session's credential, taken from the environment, since a fresh config directory has no login. */
export function sessionAuth(env: NodeJS.ProcessEnv): Record<string, string> {
	const token = env['CLAUDE_CODE_OAUTH_TOKEN']
	if (token) return { CLAUDE_CODE_OAUTH_TOKEN: token }
	const key = env['ANTHROPIC_API_KEY']
	if (key) return { ANTHROPIC_API_KEY: key }
	throw new BenchError(
		'--runner interactive gives each session a fresh config directory, which has no login: set ' +
			'CLAUDE_CODE_OAUTH_TOKEN (create one with `claude setup-token`) or ANTHROPIC_API_KEY',
	)
}

/** The multiplexer the bench is running in, or a refusal naming what to do instead. */
export function detectMux(env: NodeJS.ProcessEnv, exec: Exec = nodeExec): { name: string; adapter: MuxAdapter } {
	const probe = probeMultiplexer(exec, env)
	if (probe.mux === 'none')
		throw new BenchError(
			'--runner interactive runs each session in a terminal multiplexer pane, and none was found: ' +
				'run the bench from inside tmux or herdr, or drop --runner to use claude -p',
		)
	try {
		return { name: probe.mux, adapter: resolveMuxAdapter(env, exec) }
	} catch (e) {
		throw new BenchError(`--runner interactive: ${(e as Error).message}`)
	}
}

/** POSIX single-quoting: safe for any string, including prompts with quotes and newlines. */
export function shellQuote(s: string): string {
	return `'${s.replace(/'/g, `'\\''`)}'`
}

export interface SessionFiles {
	/** Holds everything below; removed after the run. */
	dir: string
	configDir: string
	settings: string
	launch: string
	stop: string
	stopFailure: string
	status: string
}

export function sessionFiles(dir: string): SessionFiles {
	return {
		dir,
		configDir: join(dir, 'config'),
		settings: join(dir, 'settings.json'),
		launch: join(dir, 'launch.sh'),
		stop: join(dir, 'stop.json'),
		stopFailure: join(dir, 'stop-failure.json'),
		status: join(dir, 'status.json'),
	}
}

/**
 * The `--settings` the runner adds: its two measuring hooks, and the bypass-mode confirmation
 * pre-accepted, since no one is at the pane to accept it.
 */
export function measuringSettings(files: SessionFiles) {
	return {
		hooks: {
			Stop: [{ hooks: [{ type: 'command', command: `cat > ${shellQuote(files.stop)}` }] }],
			StopFailure: [{ hooks: [{ type: 'command', command: `cat > ${shellQuote(files.stopFailure)}` }] }],
		},
		statusLine: { type: 'command', command: `cat > ${shellQuote(files.status)}` },
		skipDangerousModePermissionPrompt: true,
	}
}

/**
 * The fresh config directory's `.claude.json`: onboarding done and the checkout trusted, so the
 * session starts on the prompt rather than on a first-run dialog no one is there to answer.
 */
export function sessionState(checkout: string, auth: Record<string, string>) {
	return {
		hasCompletedOnboarding: true,
		bypassPermissionsModeAccepted: true,
		projects: {
			[checkout]: { hasTrustDialogAccepted: true, hasCompletedProjectOnboarding: true },
		},
		// Claude Code asks once before using an API key it finds in the environment.
		...(auth['ANTHROPIC_API_KEY']
			? { customApiKeyResponses: { approved: [auth['ANTHROPIC_API_KEY'].slice(-20)], rejected: [] } }
			: {}),
	}
}

/** The same flags as the `-p` runner's, less the print-only ones, plus the session id and settings. */
export function interactiveArgs(
	config: BenchConfig,
	task: BenchTask,
	checkout: string,
	files: SessionFiles,
	sessionId: string,
): string[] {
	const args = [
		'--session-id',
		sessionId,
		'--model',
		config.model,
		'--permission-mode',
		config.permissionMode,
		'--setting-sources',
		'project',
		'--strict-mcp-config',
	]
	if (existsSync(join(checkout, '.mcp.json'))) args.push('--mcp-config', '.mcp.json')
	args.push('--settings', files.settings, '--', task.prompt)
	return args
}

/**
 * The script the pane runs. It clears every `CLAUDE*` variable the pane inherited, since the bench
 * itself may be running inside a Claude Code session, then sets only the isolated config directory
 * and the credential.
 */
export function launchScript(files: SessionFiles, auth: Record<string, string>, args: string[]): string {
	return [
		'#!/bin/sh',
		'for v in $(env | sed -n "s/^\\(CLAUDE[A-Za-z0-9_]*\\)=.*/\\1/p"); do unset "$v"; done',
		`export CLAUDE_CONFIG_DIR=${shellQuote(files.configDir)}`,
		'export DISABLE_AUTOUPDATER=1',
		...Object.entries(auth).map(([k, v]) => `export ${k}=${shellQuote(v)}`),
		`exec claude ${args.map(shellQuote).join(' ')}`,
		'',
	].join('\n')
}

function readJson<T>(path: string): T | undefined {
	try {
		return JSON.parse(readFileSync(path, 'utf8')) as T
	} catch {
		// Absent, or caught mid-write: the next poll reads it again.
		return undefined
	}
}

/* istanbul ignore next -- blocks the thread; tests drive completion through a fake clock */
function sleepSync(ms: number): void {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

/** How long to let the status line catch up with the last response before reading the final cost. */
const SETTLE_MS = 2000

export interface InteractiveDeps {
	exec: Exec
	mux: MuxAdapter
	env: NodeJS.ProcessEnv
	clock: CompletionClock
	pollMs?: number
	settleMs?: number
}

/**
 * Runs one session: prepares its isolated config, opens a pane running it, waits for it to end, reads
 * its transcript and cost, and closes the pane. The session directory is removed afterwards, the
 * credential in its launch script with it.
 */
export function runSession(
	config: BenchConfig,
	task: BenchTask,
	checkout: string,
	timeoutMs: number,
	deps: InteractiveDeps,
): AgentRun {
	const auth = sessionAuth(deps.env)
	const files = sessionFiles(mkdtempSync(join(tmpdir(), 'agent-readiness-session-')))
	const sessionId = randomUUID()
	let pane: MuxTarget | undefined
	try {
		mkdirSync(files.configDir, { recursive: true })
		writeFileSync(join(files.configDir, '.claude.json'), JSON.stringify(sessionState(checkout, auth)))
		writeFileSync(files.settings, JSON.stringify(measuringSettings(files)))
		writeFileSync(files.launch, launchScript(files, auth, interactiveArgs(config, task, checkout, files, sessionId)))
		chmodSync(files.launch, 0o700)
		try {
			pane = deps.mux.open(deps.exec, {
				cwd: checkout,
				launch: `sh ${shellQuote(files.launch)}`,
				at: 'workspace',
				label: `bench ${task.id}`,
			})
		} catch (e) {
			return {
				...parseTranscript(),
				costUsd: 0,
				capped: false,
				error: `could not open a pane: ${(e as Error).message}`,
			}
		}
		const opened = pane
		const cost = () => readJson<{ cost?: { total_cost_usd?: number } }>(files.status)?.cost?.total_cost_usd
		const completion = awaitCompletion(
			{
				stopped: () => existsSync(files.stop),
				failed: () => existsSync(files.stopFailure),
				costUsd: cost,
				alive: () => deps.mux.paneExists(deps.exec, opened),
			},
			{ timeoutMs, maxBudgetUsd: config.maxBudgetUsd, pollMs: deps.pollMs ?? 1000 },
			deps.clock,
		)
		if (completion === 'done') deps.clock.sleep(deps.settleMs ?? SETTLE_MS)
		const stop = readJson<{ transcript_path?: string; error?: unknown }>(
			completion === 'failed' ? files.stopFailure : files.stop,
		)
		const transcript = stop?.transcript_path ?? findTranscript(files.configDir, sessionId)
		const texts = transcript ? readTranscripts(transcript) : []
		const metrics = parseTranscript(...texts)
		const costUsd = cost()
		return {
			...metrics,
			// The main session's lines, then each subagent's, as one JSONL.
			...(texts.length > 0 ? { transcript: texts.map((t) => (t.endsWith('\n') ? t : `${t}\n`)).join('') } : {}),
			costUsd: costUsd ?? 0,
			capped: completion !== 'done',
			...(completion === 'exited' ? { error: 'the session closed before the agent finished' } : {}),
			...(completion === 'failed'
				? { error: `the agent's turn failed on an API error${stop?.error ? `: ${JSON.stringify(stop.error)}` : ''}` }
				: {}),
			...(costUsd === undefined && metrics.turns > 0
				? { error: 'the session reported no cost, so the spend cap was not enforced' }
				: {}),
		}
	} finally {
		if (pane) deps.mux.teardown(deps.exec, pane)
		rmSync(files.dir, { recursive: true, force: true })
	}
}

/** Where Claude Code keeps a session's transcript: `projects/<project>/<session-id>.jsonl`. */
export function findTranscript(configDir: string, sessionId: string): string | undefined {
	const projects = join(configDir, 'projects')
	if (!existsSync(projects)) return undefined
	for (const project of readdirSync(projects)) {
		const path = join(projects, project, `${sessionId}.jsonl`)
		if (existsSync(path)) return path
	}
	return undefined
}

/**
 * The interactive runner, bound to the multiplexer the bench runs in. Refuses up front, before any
 * run, when there is no multiplexer or no credential for the isolated sessions.
 */
export function interactiveRunner(env: NodeJS.ProcessEnv = process.env, exec: Exec = nodeExec): Runner {
	const { adapter } = detectMux(env, exec)
	sessionAuth(env)
	const clock: CompletionClock = { now: () => Date.now(), sleep: sleepSync }
	return {
		name: 'interactive',
		shell: hostShell,
		agent: (config, task, checkout, timeoutMs) =>
			runSession(config, task, checkout, timeoutMs, { exec, mux: adapter, env, clock }),
		now: clock.now,
	}
}
