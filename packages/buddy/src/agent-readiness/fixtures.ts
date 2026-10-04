/**
 * Finds tracked fixture and vendored folders that search still reads. They are committed on purpose,
 * so `build-output-untracked` does not flag them, but every file in them shows up in `rg` and in an
 * agent's grep. Whether a folder should be searched stays a judgment.
 */

import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

export interface SearchedFixtureDir {
	/** The folder, with a trailing slash. */
	path: string
	/** Tracked files in it that no ignore file excludes from search. */
	searchedFiles: number
}

const FIXTURE_DIR = /^(fixtures?|__fixtures__|test-?fixtures|testcases|__snapshots__|vendor(ed)?|third[_-]?party)$/
/** The ignore files ripgrep reads beside `.gitignore`, lowest precedence first. */
const SEARCH_IGNORE_FILES = ['.ignore', '.rgignore']

/** Tracked files grouped by the outermost fixture or vendored folder that holds them. */
export function groupFixtureFiles(files: string[]): Map<string, string[]> {
	const groups = new Map<string, string[]>()
	for (const file of files) {
		const segments = file.split('/')
		const at = segments.slice(0, -1).findIndex((s) => FIXTURE_DIR.test(s))
		if (at === -1) continue
		const dir = `${segments.slice(0, at + 1).join('/')}/`
		groups.set(dir, [...(groups.get(dir) ?? []), file])
	}
	return groups
}

/**
 * Rewrites a nested ignore file's patterns to root-relative ones, so one excludes file can carry
 * every `.ignore` and `.rgignore` in the repo.
 */
export function rootRelativePatterns(text: string, dir: string): string[] {
	const patterns: string[] = []
	for (const raw of text.split(/\r?\n/)) {
		const line = raw.trimEnd()
		if (line === '' || line.startsWith('#')) continue
		if (!dir) {
			patterns.push(line)
			continue
		}
		const negated = line.startsWith('!')
		const body = negated ? line.slice(1) : line
		// A slash anywhere but the end anchors a pattern to its ignore file's folder.
		const anchored = body.slice(0, -1).includes('/')
		const pattern = anchored ? `/${dir}/${body.replace(/^\//, '')}` : `/${dir}/**/${body}`
		patterns.push(negated ? `!${pattern}` : pattern)
	}
	return patterns
}

function searchIgnorePatterns(dir: string, files: string[]): string[] {
	const ignoreFiles = files
		.filter((f) => SEARCH_IGNORE_FILES.some((name) => f === name || f.endsWith(`/${name}`)))
		// A deeper file, and `.rgignore` over `.ignore`, wins: later lines take precedence.
		.sort(
			(a, b) =>
				a.split('/').length - b.split('/').length ||
				SEARCH_IGNORE_FILES.indexOf(a.split('/').pop() as string) -
					SEARCH_IGNORE_FILES.indexOf(b.split('/').pop() as string),
		)
	return ignoreFiles.flatMap((file) => {
		const folder = dirname(file)
		return rootRelativePatterns(readFileSync(join(dir, file), 'utf8'), folder === '.' ? '' : folder)
	})
}

/**
 * The fixture and vendored folders with files search still reads. `.gitignore`, `.git/info/exclude`,
 * `.ignore`, and `.rgignore` all count, as they do for ripgrep. Needs a git repo.
 */
export function findSearchedFixtureDirs(dir: string, files: string[]): SearchedFixtureDir[] {
	const groups = groupFixtureFiles(files)
	if (groups.size === 0) return []
	const scratch = mkdtempSync(join(tmpdir(), 'agent-readiness-ignore-'))
	try {
		const excludes = join(scratch, 'excludes')
		writeFileSync(excludes, searchIgnorePatterns(dir, files).join('\n'))
		const candidates = [...groups.values()].flat()
		const r = spawnSync('git', ['-c', `core.excludesFile=${excludes}`, 'check-ignore', '--no-index', '--stdin', '-z'], {
			cwd: dir,
			input: candidates.join('\0'),
			encoding: 'utf8',
			maxBuffer: 64 * 1024 * 1024,
		})
		const excluded = new Set(r.stdout.split('\0').filter(Boolean))
		return [...groups]
			.map(([path, inside]) => ({ path, searchedFiles: inside.filter((f) => !excluded.has(f)).length }))
			.filter((d) => d.searchedFiles > 0)
			.sort((a, b) => b.searchedFiles - a.searchedFiles)
	} finally {
		rmSync(scratch, { recursive: true, force: true })
	}
}
