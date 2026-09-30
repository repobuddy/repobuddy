/**
 * Runs buddy-agent-harness `doctor` for the instructions area, so `score` reports what it finds about
 * bridges, skill layout, and MCP files instead of re-implementing those checks. It runs only when the
 * repo has buddy-agent-harness installed, and `doctor` is read-only.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export interface HarnessFinding {
	path: string
	/** doctor's problem name, such as `missing` or `mcp-literal-secret`. */
	problem: string
	detail: string
}

export interface HarnessDoctorRun {
	/** `ok`: doctor reported, with or without findings. `error`: it did not complete or its output was unreadable. */
	outcome: 'ok' | 'error'
	findings: HarnessFinding[]
	/** Why the run did not complete, for `error`. */
	error?: string
}

/** `doctor` reads files only; a run past this budget is stuck, not busy. */
const DOCTOR_TIMEOUT_MS = 60 * 1000

/** The installed CLI's entry file, or `undefined` when the repo does not have buddy-agent-harness installed. */
export function findHarnessDoctor(dir: string): string | undefined {
	const manifest = join(dir, 'node_modules', 'buddy-agent-harness', 'package.json')
	if (!existsSync(manifest)) return undefined
	try {
		const { bin } = JSON.parse(readFileSync(manifest, 'utf8')) as { bin?: string | Record<string, string> }
		const entry = typeof bin === 'string' ? bin : bin?.['buddy-agent-harness']
		return entry ? join(dirname(manifest), entry) : undefined
	} catch {
		return undefined
	}
}

function isFinding(value: unknown): value is HarnessFinding {
	if (typeof value !== 'object' || value === null) return false
	const { path, problem, detail } = value as Record<string, unknown>
	return typeof path === 'string' && typeof problem === 'string' && typeof detail === 'string'
}

/**
 * Reads `doctor --format json`. Its `findings` is an array of problems, or a sentence when there are
 * none; doctor exits 0 either way.
 */
export function readDoctorRun(status: number | null, stdout: string, error?: string): HarnessDoctorRun {
	if (status !== 0) {
		return { outcome: 'error', findings: [], error: error ?? (status === null ? 'timed out' : `exit ${status}`) }
	}
	let report: unknown
	try {
		report = JSON.parse(stdout)
	} catch {
		return { outcome: 'error', findings: [], error: 'output is not JSON' }
	}
	const findings = (report as { findings?: unknown } | null)?.findings
	if (typeof findings === 'string') return { outcome: 'ok', findings: [] }
	if (Array.isArray(findings) && findings.every(isFinding)) {
		return { outcome: 'ok', findings: findings.map(({ path, problem, detail }) => ({ path, problem, detail })) }
	}
	return { outcome: 'error', findings: [], error: 'output has no findings list' }
}

/* istanbul ignore next -- runs the repo's real buddy-agent-harness; tests drive readDoctorRun directly */
export function runHarnessDoctor(dir: string, entry: string): HarnessDoctorRun {
	const result = spawnSync(process.execPath, [entry, 'doctor', '--format', 'json', '--root', dir], {
		cwd: dir,
		encoding: 'utf8',
		timeout: DOCTOR_TIMEOUT_MS,
		maxBuffer: 16 * 1024 * 1024,
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	return readDoctorRun(result.status, result.stdout ?? '', result.error?.message)
}
