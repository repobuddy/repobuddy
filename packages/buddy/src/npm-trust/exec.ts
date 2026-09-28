import { execFileSync, execSync } from 'node:child_process'

/** Runs one shell command (used for read-only `gh`/`npm view` lookups) and returns trimmed stdout. */
export type Sh = (cmd: string) => string

/* istanbul ignore next -- shells out to the real `gh`/`npm` CLIs; every caller is exercised in tests through an injected fake instead */
export const realSh: Sh = (cmd) => execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()

export function shJson<T>(sh: Sh, cmd: string): T | null {
	try {
		return JSON.parse(sh(cmd)) as T
	} catch {
		return null
	}
}

/** Runs the mutating `npm trust github …` call. Throws an Error whose `stderr` carries npm's message. */
export type NpmTrustGithub = (args: string[]) => void

/* istanbul ignore next -- shells out to the real `npm` CLI and mutates registry state; tests inject a fake instead */
export const realNpmTrustGithub: NpmTrustGithub = (args) => {
	try {
		execFileSync('npm', args, { stdio: ['ignore', 'ignore', 'pipe'] })
	} catch (e) {
		const err = e as { stderr?: Buffer | string; message?: string }
		const error = new Error(String(err.stderr ?? err.message ?? ''))
		throw error
	}
}

/** Rate-limits between `npm trust` calls. Tests inject a no-op to keep the suite fast. */
export type Wait = () => void

/* istanbul ignore next -- real rate-limit sleep; tests inject a no-op instead */
export const realWait: Wait = () => {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000)
}
