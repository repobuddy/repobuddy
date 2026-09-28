import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import type { Exec } from './exec.js'
import { ALL_WORKFLOWS, type ScaffoldState, scaffoldWorkflows } from './scaffold-workflows.js'

let dir: string
let statePath: string

const baseState: ScaffoldState = {
	repo: 'octo/repo',
	defaultBranch: 'main',
	detected: {
		language: 'typescript',
		codeqlLanguage: 'javascript',
		packageManager: 'pnpm',
		hasPackageJson: true,
		hasDependabotConfig: false,
		existingWorkflows: [],
	},
}

function writeState(
	state: Partial<Omit<ScaffoldState, 'detected'>> & { detected?: Partial<ScaffoldState['detected']> } = {},
) {
	writeFileSync(
		statePath,
		JSON.stringify({ ...baseState, ...state, detected: { ...baseState.detected, ...state.detected } }),
	)
}

beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'scaffold-workflows-repo-'))
	statePath = join(dir, 'state.json')
})

afterEach(() => {
	rmSync(dir, { recursive: true, force: true })
})

describe('scaffoldWorkflows', () => {
	it('rejects when the state file is missing', async () => {
		await expect(scaffoldWorkflows({ statePath: join(dir, 'nope.json'), dir, yes: true })).rejects.toThrow(
			/State file not found/,
		)
	})

	it('creates all workflows for a repo with none yet, when confirmed', async () => {
		writeState()
		const result = await scaffoldWorkflows({ statePath, dir, yes: true })
		expect(result.ok).toBe(true)
		expect(result.created.sort()).toEqual(ALL_WORKFLOWS.map((w) => join('.github', 'workflows', `${w}.yml`)).sort())
		for (const w of ALL_WORKFLOWS) {
			expect(existsSync(join(dir, '.github', 'workflows', `${w}.yml`))).toBe(true)
		}
		const pr = readFileSync(join(dir, '.github', 'workflows', 'pull-request.yml'), 'utf8')
		expect(pr).toContain('pnpm install --frozen-lockfile')
		expect(pr).toContain('pnpm test')
		const release = readFileSync(join(dir, '.github', 'workflows', 'release.yml'), 'utf8')
		expect(release).toContain('branches: [main]')
		const codeql = readFileSync(join(dir, '.github', 'workflows', 'codeql.yml'), 'utf8')
		expect(codeql).toContain("language: ['javascript']")
	})

	it('skips workflows that already exist', async () => {
		writeState({ detected: { existingWorkflows: ['pull-request.yml'] } })
		const result = await scaffoldWorkflows({ statePath, dir, yes: true, workflows: 'pull-request,release' })
		expect(result.skipped).toEqual([{ name: 'pull-request.yml', reason: 'already exists' }])
		expect(result.created).toEqual([join('.github', 'workflows', 'release.yml')])
	})

	it('reports nothing to create when the offered list is already fully present', async () => {
		writeState({ detected: { existingWorkflows: ['pull-request.yml'] } })
		const result = await scaffoldWorkflows({ statePath, dir, yes: true, workflows: 'pull-request' })
		expect(result).toEqual({ ok: true, created: [], skipped: [{ name: 'pull-request.yml', reason: 'already exists' }] })
	})

	it('infers a narrower offer set when workflows already exist and no --workflows is given', async () => {
		writeState({ detected: { existingWorkflows: ['ci.yml'], hasDependabotConfig: true } })
		const result = await scaffoldWorkflows({ statePath, dir, yes: true })
		expect(result.created.map((c) => c.split('/').pop())).toEqual(
			expect.arrayContaining(['pull-request.yml', 'release.yml', 'dependabot-automerge.yml', 'codeql.yml']),
		)
	})

	it('skips unknown workflow names', async () => {
		writeState()
		const result = await scaffoldWorkflows({ statePath, dir, yes: true, workflows: 'bogus' })
		expect(result.skipped).toEqual([{ name: 'bogus.yml', reason: 'unknown workflow name' }])
		expect(result.created).toEqual([])
	})

	it('aborts without creating files when not confirmed', async () => {
		writeState()
		const result = await scaffoldWorkflows({ statePath, dir, confirm: async () => false })
		expect(result).toEqual({ ok: false, reason: 'aborted', created: [], skipped: [] })
		expect(existsSync(join(dir, '.github', 'workflows'))).toBe(false)
	})

	it('proceeds when the injected confirm resolves true', async () => {
		writeState()
		const result = await scaffoldWorkflows({ statePath, dir, confirm: async () => true, workflows: 'codeql' })
		expect(result.ok).toBe(true)
		expect(result.created).toEqual([join('.github', 'workflows', 'codeql.yml')])
	})

	it('renders non-Node templates when there is no package manager or package.json', async () => {
		writeState({ detected: { packageManager: null, hasPackageJson: false, codeqlLanguage: null } })
		const result = await scaffoldWorkflows({ statePath, dir, yes: true, workflows: 'pull-request,release,codeql' })
		expect(result.ok).toBe(true)
		const pr = readFileSync(join(dir, '.github', 'workflows', 'pull-request.yml'), 'utf8')
		expect(pr).toContain('echo "TODO: add your CI commands here"')
		const release = readFileSync(join(dir, '.github', 'workflows', 'release.yml'), 'utf8')
		expect(release).not.toContain('setup-node')
		const codeql = readFileSync(join(dir, '.github', 'workflows', 'codeql.yml'), 'utf8')
		expect(codeql).toContain("language: ['javascript']")
	})

	it('renders bun/yarn/npm install and test commands', async () => {
		for (const [pm, install, test] of [
			['bun', 'bun install --frozen-lockfile', 'bun test'],
			['yarn', 'yarn install --frozen-lockfile', 'yarn test'],
			['npm', 'npm ci', 'npm test'],
		] as const) {
			writeState({ detected: { packageManager: pm } })
			const result = await scaffoldWorkflows({ statePath, dir, yes: true, workflows: 'pull-request' })
			expect(result.ok).toBe(true)
			const pr = readFileSync(join(dir, '.github', 'workflows', 'pull-request.yml'), 'utf8')
			expect(pr).toContain(install)
			expect(pr).toContain(test)
			rmSync(join(dir, '.github', 'workflows', 'pull-request.yml'))
		}
	})

	it('resolves the default state path from gh when --state is not given', async () => {
		const nested = mkdtempSync(join(tmpdir(), 'scaffold-workflows-out-'))
		try {
			const target = join(nested, 'state.json')
			writeFileSync(target, JSON.stringify(baseState))
			const exec: Exec = {
				run: (cmd) => {
					if (cmd.includes('nameWithOwner')) return baseState.repo
					throw new Error(`unexpected command: ${cmd}`)
				},
			}
			// Point the deterministic path lookup at our fixture by pre-seeding the real path it resolves to.
			const { stateArtifactPath } = await import('./state-path.js')
			const realPath = stateArtifactPath(baseState.repo)
			mkdirSync(join(realPath, '..'), { recursive: true })
			writeFileSync(realPath, readFileSync(target, 'utf8'))
			try {
				const result = await scaffoldWorkflows({ dir, exec, yes: true, workflows: 'codeql' })
				expect(result.ok).toBe(true)
			} finally {
				rmSync(realPath, { force: true })
			}
		} finally {
			rmSync(nested, { recursive: true, force: true })
		}
	})

	it('logs progress when a log function is supplied', async () => {
		writeState({ detected: { existingWorkflows: ['pull-request.yml'] } })
		const lines: string[] = []
		const result = await scaffoldWorkflows({
			statePath,
			dir,
			yes: true,
			workflows: 'pull-request,codeql',
			log: (m) => lines.push(m),
		})
		expect(result.ok).toBe(true)
		expect(lines.some((l) => l.includes('skip'))).toBe(true)
		expect(lines.some((l) => l.includes('created'))).toBe(true)
	})
})
