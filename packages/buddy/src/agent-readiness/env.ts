/**
 * Finds the environment variables JS and TS source reads that no setup document names. A variable an
 * agent cannot discover fails the run at the point it is read, far from any hint of what to set.
 */

import { isScannedSource } from './source.js'

export interface UndocumentedEnv {
	name: string
	/** The first file that reads it. */
	readIn: string
}

const JS_SOURCE = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/
/** `process.env.X`, `process.env['X']`, `import.meta.env.X`, and the bracket form of the latter. */
const ENV_READ = /\b(?:process\.env|import\.meta\.env)(?:\.([A-Za-z_]\w*)|\[\s*(['"`])([A-Za-z_]\w*)\2\s*\])/g
/** Where a variable counts as documented: the files a person or agent reads to set up. */
const SETUP_DOC = /(^|\/)(readme|contributing)(\.[a-z]+)?$|(^|\/)\.env\.[^/]*(example|sample|template|dist)$/i

/** Set by the OS, the shell, the package manager, a CI runner, or the bundler; nobody sets these by hand. */
const WELL_KNOWN = new Set([
	'NODE_ENV',
	'CI',
	'HOME',
	'PATH',
	'PWD',
	'USER',
	'USERNAME',
	'USERPROFILE',
	'SHELL',
	'LANG',
	'TERM',
	'COLORTERM',
	'TZ',
	'TMPDIR',
	'TEMP',
	'TMP',
	'APPDATA',
	'LOCALAPPDATA',
	'NO_COLOR',
	'FORCE_COLOR',
	'DEBUG',
	'VITEST',
	'JEST_WORKER_ID',
	// Vite and Astro fill these on `import.meta.env`.
	'MODE',
	'DEV',
	'PROD',
	'SSR',
	'BASE_URL',
	'SITE',
	'ASSETS_PREFIX',
])
const WELL_KNOWN_PREFIX = /^(npm_|GITHUB_|RUNNER_|XDG_)/

export function isSetupDoc(path: string): boolean {
	return SETUP_DOC.test(path)
}

/** Every environment variable a text reads, in order of first read. */
export function readEnvNames(text: string): string[] {
	const names = new Set<string>()
	for (const m of text.matchAll(ENV_READ)) names.add((m[1] ?? m[3]) as string)
	return [...names]
}

/**
 * `undefined` when there is no non-test JS or TS source. A name counts as documented when it appears
 * as a whole word in any of `docs`.
 */
export function findUndocumentedEnv(
	searched: string[],
	docs: string[],
	read: (path: string) => string | undefined,
): UndocumentedEnv[] | undefined {
	const sources = searched.filter((f) => JS_SOURCE.test(f) && isScannedSource(f))
	if (sources.length === 0) return undefined
	const readIn = new Map<string, string>()
	for (const path of sources) {
		for (const name of readEnvNames(read(path) ?? '')) {
			if (!WELL_KNOWN.has(name) && !WELL_KNOWN_PREFIX.test(name) && !readIn.has(name)) readIn.set(name, path)
		}
	}
	if (readIn.size === 0) return []
	const documented = new Set(docs.flatMap((path) => (read(path) ?? '').match(/\w+/g) ?? []))
	return [...readIn]
		.filter(([name]) => !documented.has(name))
		.map(([name, path]) => ({ name, readIn: path }))
		.sort((a, b) => a.name.localeCompare(b.name))
}
