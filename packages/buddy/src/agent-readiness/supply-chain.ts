/**
 * Reads the CI supply-chain settings `score` reports on: whether GitHub Actions workflows pin their
 * third-party actions and scope their token, and whether the package manager holds back fresh releases.
 * Workflows are read line by line, not parsed as YAML, so an unusual layout can be missed; these checks
 * report and never cap the level.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { load, readAge, toMinutes } from '../release-age/config-file.js'
import { detectManager, MANAGERS } from '../release-age/managers.js'

const WORKFLOW_DIR = '.github/workflows'
/** GitHub publishes these; a tag on them is not a third party's to move. */
const FIRST_PARTY_OWNERS = new Set(['actions', 'github'])
const USES = /^\s*(?:-\s+)?uses\s*:\s*['"]?([^'"\s#]+)/
const COMMIT_SHA = /@[0-9a-f]{40}$/

export interface WorkflowFacts {
	files: string[]
	/** `<file>: <uses>` for each third-party action or reusable workflow not pinned to a commit SHA. */
	unpinnedActions: string[]
	/** `<file>` with no `permissions:` anywhere, or `<file>: <job>, …` naming the jobs without one. */
	missingPermissions: string[]
}

export interface ReleaseAgeGate {
	file: string
	setting: string
	/** The value as written; `undefined` when the setting is absent. */
	value: string | undefined
	minutes: number | undefined
	/** What applies when the setting is absent. */
	defaultNote: string
}

function isUnpinned(ref: string): boolean {
	if (ref.startsWith('./')) return false
	if (ref.startsWith('docker://')) return !ref.includes('@sha256:')
	const owner = ref.split('/')[0] as string
	return !FIRST_PARTY_OWNERS.has(owner) && !COMMIT_SHA.test(ref)
}

function indentOf(line: string): number {
	return line.length - line.trimStart().length
}

function isContent(line: string): boolean {
	const trimmed = line.trim()
	return trimmed !== '' && !trimmed.startsWith('#')
}

/** Jobs under `jobs:` with no `permissions:` of their own. */
function jobsWithoutPermissions(lines: string[]): { jobs: number; missing: string[] } {
	const start = lines.findIndex((l) => /^jobs\s*:/.test(l))
	if (start === -1) return { jobs: 0, missing: [] }
	const jobs = new Map<string, boolean>()
	let jobIndent: number | undefined
	let childIndent: number | undefined
	let current: string | undefined
	for (const line of lines.slice(start + 1)) {
		if (!isContent(line)) continue
		const indent = indentOf(line)
		if (indent === 0) break
		jobIndent ??= indent
		if (indent === jobIndent) {
			current = /^\s*([^\s:]+)\s*:/.exec(line)?.[1]
			if (current) jobs.set(current, false)
			childIndent = undefined
			continue
		}
		if (current === undefined || indent < jobIndent) continue
		childIndent ??= indent
		if (indent === childIndent && /^\s*permissions\s*:/.test(line)) jobs.set(current, true)
	}
	return { jobs: jobs.size, missing: [...jobs].filter(([, has]) => !has).map(([name]) => name) }
}

/** `undefined` when the repo has no `.github/workflows`. */
export function readWorkflows(dir: string): WorkflowFacts | undefined {
	const root = join(dir, WORKFLOW_DIR)
	if (!existsSync(root)) return undefined
	const files = readdirSync(root)
		.filter((f) => /\.ya?ml$/.test(f))
		.sort()
		.map((f) => `${WORKFLOW_DIR}/${f}`)
	const unpinnedActions: string[] = []
	const missingPermissions: string[] = []
	for (const file of files) {
		const lines = readFileSync(join(dir, file), 'utf8').split(/\r?\n/)
		for (const line of lines) {
			const ref = USES.exec(line)?.[1]
			if (ref && isUnpinned(ref)) unpinnedActions.push(`${file}: ${ref}`)
		}
		if (lines.some((l) => /^permissions\s*:/.test(l))) continue
		const { jobs, missing } = jobsWithoutPermissions(lines)
		if (jobs === 0 || missing.length === jobs) missingPermissions.push(file)
		else if (missing.length > 0) missingPermissions.push(`${file}: ${missing.join(', ')}`)
	}
	return { files, unpinnedActions, missingPermissions }
}

/** `undefined` when the repo has no JavaScript package manager to gate. */
export function readReleaseAgeGate(dir: string): ReleaseAgeGate | undefined {
	let pm: ReturnType<typeof detectManager>
	try {
		pm = detectManager(dir)
	} catch {
		// detectManager throws on an unparsable package.json; that repo has no manager to report on.
		return undefined
	}
	if (!pm) return undefined
	const cfg = MANAGERS[pm]
	const value = readAge(pm, load(dir, pm).lines)
	return {
		file: cfg.file,
		setting: cfg.ageKey,
		value,
		minutes: value === undefined ? undefined : toMinutes(pm, value),
		defaultNote: cfg.defaultNote,
	}
}
