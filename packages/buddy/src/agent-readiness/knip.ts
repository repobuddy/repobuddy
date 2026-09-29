/**
 * Runs knip for `score --run-knip`, so the `dead-code` check can be settled by the script instead of
 * left to judgment. It is opt-in because it runs the repo's own tooling and needs dependencies installed;
 * plain `score` stays a read of files and git.
 */

import { spawnSync } from 'node:child_process'

export interface DeadCodeRun {
	command: string
	/** `clean`: knip found nothing. `found`: it reported unused code. `error`: it did not complete. */
	outcome: 'clean' | 'found' | 'error'
	/** knip's report headings, such as `Unused exports (4)`. */
	groups: string[]
	/** Why the run did not complete, for `error`. */
	error?: string
}

/** knip's own run budget. A repo large enough to exceed it should settle `dead-code` by hand. */
const KNIP_TIMEOUT_MS = 5 * 60 * 1000

// biome-ignore lint/suspicious/noControlCharactersInRegex: strips the ANSI color codes knip may print
const ANSI = /\x1b\[[0-9;]*m/g
const GROUP_HEADING = /^([A-Z][A-Za-z ]+) \((\d+)\)$/

/** knip exits 0 when clean and 1 when it reports issues; anything else is a failed run. */
export function readKnipRun(command: string, status: number | null, output: string, error?: string): DeadCodeRun {
	const lines = output.replace(ANSI, '').split('\n')
	const groups = lines.map((l) => l.trim()).filter((l) => GROUP_HEADING.test(l))
	if (status === 0) return { command, outcome: 'clean', groups: [] }
	if (status === 1 && groups.length > 0) return { command, outcome: 'found', groups }
	const reason =
		error ??
		(status === null
			? 'timed out'
			: `exit ${status}${lines.find((l) => l.trim()) ? `: ${lines.find((l) => l.trim())?.trim()}` : ''}`)
	return { command, outcome: 'error', groups: [], error: reason }
}

/* istanbul ignore next -- runs the repo's real knip; tests drive readKnipRun directly */
export function runKnip(dir: string, command: string): DeadCodeRun {
	const result = spawnSync(command, {
		cwd: dir,
		shell: true,
		encoding: 'utf8',
		timeout: KNIP_TIMEOUT_MS,
		maxBuffer: 64 * 1024 * 1024,
		stdio: ['ignore', 'pipe', 'pipe'],
		env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
	})
	return readKnipRun(command, result.status, `${result.stdout ?? ''}\n${result.stderr ?? ''}`, result.error?.message)
}
