import { execSync } from 'node:child_process'

/** Runs one shell command and returns trimmed stdout. Injected so tests never call the real `gh` CLI. */
export interface Exec {
	run: (cmd: string) => string
}

/* istanbul ignore next -- shells out to the real `gh` CLI; every caller is exercised in tests through an injected fake Exec instead */
export const realExec: Exec = {
	run: (cmd) => execSync(cmd, { encoding: 'utf8' }).trim(),
}

export function runJson<T>(exec: Exec, cmd: string): T | null {
	try {
		return JSON.parse(exec.run(cmd)) as T
	} catch {
		return null
	}
}
