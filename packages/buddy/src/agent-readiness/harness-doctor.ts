/**
 * Runs buddy-agent-harness `doctor` for the instructions area, so `score` reports what it finds about
 * bridges, skill layout, and MCP files instead of re-implementing those checks. It runs when the repo
 * has buddy-agent-harness installed, or is buddy-agent-harness (at its root or as a workspace
 * package), and `doctor` is read-only.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { workspaceDirs, workspaceGlobs } from './workspaces.js'

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

export interface HarnessDoctor {
	/** `dependency`: installed in `node_modules`. `repo`: the repo root is buddy-agent-harness. `workspace`: one of its workspace packages is. */
	source: 'dependency' | 'repo' | 'workspace'
	packageDir: string
	/** The node arguments that start the CLI; `doctor` and its options follow them. */
	args: string[]
}

export interface FindHarnessDoctorOptions {
	/** Whether this node can run TypeScript source, parameter properties included (`--experimental-transform-types`). */
	transformTypes?: boolean | undefined
}

const NAME = 'buddy-agent-harness'

/** `doctor` reads files only; a run past this budget is stuck, not busy. */
const DOCTOR_TIMEOUT_MS = 60 * 1000

function readManifest(packageDir: string): { name?: unknown; bin?: unknown } | undefined {
	try {
		return JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')) ?? undefined
	} catch {
		return undefined
	}
}

function binEntry(packageDir: string, bin: unknown): string[] | undefined {
	const entry = typeof bin === 'string' ? bin : (bin as Record<string, unknown> | undefined)?.[NAME]
	return typeof entry === 'string' ? [join(packageDir, entry)] : undefined
}

/**
 * The repo's own buddy-agent-harness runs from `src/cli.ts`, whose `run(argv)` the bin calls once it is
 * built, so `score` needs no build there. It needs `--experimental-transform-types`, not node's default
 * type stripping, which rejects the parameter properties the source uses. Node runs no TypeScript under
 * `node_modules`, so an installed copy always runs its bin.
 */
function sourceEntry(packageDir: string, transformTypes: boolean): string[] | undefined {
	const cli = join(packageDir, 'src', 'cli.ts')
	if (!transformTypes || !existsSync(cli)) return undefined
	const code = [
		`const { run } = await import(${JSON.stringify(pathToFileURL(cli).href)})`,
		`process.exitCode = await run([process.argv[0], ${JSON.stringify(cli)}, ...process.argv.slice(1)])`,
	].join('\n')
	return ['--experimental-transform-types', '--input-type=module', '-e', code]
}

/**
 * How to start buddy-agent-harness for this repo, or `undefined` when there is none. The repo's own
 * package comes first, then a workspace package, then an installed dependency: when the repo is
 * buddy-agent-harness, its source is what is being scored.
 */
export function findHarnessDoctor(
	dir: string,
	{
		transformTypes = process.allowedNodeEnvironmentFlags.has('--experimental-transform-types'),
	}: FindHarnessDoctorOptions = {},
): HarnessDoctor | undefined {
	const root = readManifest(dir)
	const local = (source: 'repo' | 'workspace', packageDir: string, bin: unknown): HarnessDoctor | undefined => {
		const args = sourceEntry(packageDir, transformTypes) ?? binEntry(packageDir, bin)
		return args ? { source, packageDir, args } : undefined
	}
	if (root?.name === NAME) {
		const doctor = local('repo', dir, root.bin)
		if (doctor) return doctor
	}
	for (const relative of workspaceDirs(dir, workspaceGlobs(dir, (root as { workspaces?: unknown })?.workspaces))) {
		const packageDir = join(dir, relative)
		const manifest = readManifest(packageDir)
		if (manifest?.name !== NAME) continue
		const doctor = local('workspace', packageDir, manifest.bin)
		if (doctor) return doctor
	}
	const installed = join(dir, 'node_modules', NAME)
	const args = binEntry(installed, readManifest(installed)?.bin)
	return args ? { source: 'dependency', packageDir: installed, args } : undefined
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

export function runHarnessDoctor(dir: string, doctor: HarnessDoctor): HarnessDoctorRun {
	const result = spawnSync(process.execPath, [...doctor.args, 'doctor', '--format', 'json', '--root', dir], {
		cwd: dir,
		encoding: 'utf8',
		timeout: DOCTOR_TIMEOUT_MS,
		maxBuffer: 16 * 1024 * 1024,
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	return readDoctorRun(result.status, result.stdout ?? '', result.error?.message)
}
