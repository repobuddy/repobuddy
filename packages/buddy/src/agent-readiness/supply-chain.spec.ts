import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from '@jest/globals'
import { readReleaseAgeGate, readWorkflows } from './supply-chain.js'

const dirs: string[] = []

function repo(files: Record<string, string>) {
	const dir = mkdtempSync(join(tmpdir(), 'agent-readiness-supply-'))
	dirs.push(dir)
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(dirname(join(dir, path)), { recursive: true })
		writeFileSync(join(dir, path), content)
	}
	return dir
}

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

const SHA = 'a'.repeat(40)

describe('readWorkflows', () => {
	it('is undefined without .github/workflows', () => {
		expect(readWorkflows(repo({ 'README.md': '' }))).toBeUndefined()
	})

	it('lists third-party actions and reusable workflows not pinned to a commit SHA', () => {
		const dir = repo({
			'.github/workflows/ci.yml': [
				'permissions:',
				'  contents: read',
				'jobs:',
				'  shared:',
				'    uses: org/repo/.github/workflows/verify.yml@v2',
				'  build:',
				'    steps:',
				'      - uses: actions/checkout@v5',
				'      - uses: github/codeql-action/init@v4',
				'      - uses: ./.github/actions/local',
				`      - uses: pnpm/action-setup@${SHA} # v4`,
				"      - uses: 'pnpm/action-setup@v4'",
				'      - name: image',
				'        uses: docker://alpine:3',
				'      - uses: docker://alpine@sha256:abc',
			].join('\n'),
		})
		expect(readWorkflows(dir)?.unpinnedActions).toEqual([
			'.github/workflows/ci.yml: org/repo/.github/workflows/verify.yml@v2',
			'.github/workflows/ci.yml: pnpm/action-setup@v4',
			'.github/workflows/ci.yml: docker://alpine:3',
		])
	})

	it('passes a workflow with top-level permissions, or with permissions on every job', () => {
		const dir = repo({
			'.github/workflows/a.yml': 'on: push\npermissions: read-all\njobs:\n  x:\n    runs-on: ubuntu-latest\n',
			'.github/workflows/b.yaml': [
				'jobs:',
				'  # a comment',
				'  x:',
				'    permissions:',
				'      contents: read',
				'  y:',
				'    permissions: {}',
			].join('\n'),
		})
		expect(readWorkflows(dir)).toEqual({
			files: ['.github/workflows/a.yml', '.github/workflows/b.yaml'],
			unpinnedActions: [],
			missingPermissions: [],
		})
	})

	it('names the workflow when nothing declares permissions, and the jobs when only some do', () => {
		const dir = repo({
			'.github/workflows/none.yml': 'jobs:\n  x:\n    runs-on: ubuntu-latest\n',
			'.github/workflows/some.yml': [
				'jobs:',
				'  x:',
				'    permissions:',
				'      contents: write',
				'  y:',
				'    steps:',
				'      - with:',
				'          permissions: not-a-job-key',
				'  z:',
				'    runs-on: ubuntu-latest',
				'on: push',
			].join('\n'),
			'.github/workflows/notes.md': '',
		})
		expect(readWorkflows(dir)?.missingPermissions).toEqual([
			'.github/workflows/none.yml',
			'.github/workflows/some.yml: y, z',
		])
	})
})

describe('readReleaseAgeGate', () => {
	it('is undefined without a JavaScript package manager', () => {
		expect(readReleaseAgeGate(repo({ 'go.mod': '' }))).toBeUndefined()
	})

	it('is undefined when package.json does not parse', () => {
		expect(readReleaseAgeGate(repo({ 'package.json': '{' }))).toBeUndefined()
	})

	it('reads the pnpm setting from pnpm-workspace.yaml', () => {
		const dir = repo({ 'pnpm-lock.yaml': '', 'pnpm-workspace.yaml': 'minimumReleaseAge: 1440\n' })
		expect(readReleaseAgeGate(dir)).toEqual({
			file: 'pnpm-workspace.yaml',
			setting: 'minimumReleaseAge',
			value: '1440',
			minutes: 1440,
			defaultNote: 'pnpm 11+ defaults to 1440 minutes',
		})
	})

	it('reports an absent setting with what applies instead', () => {
		const dir = repo({ 'package.json': JSON.stringify({ packageManager: 'npm@11.0.0' }) })
		expect(readReleaseAgeGate(dir)).toMatchObject({
			file: '.npmrc',
			setting: 'min-release-age',
			value: undefined,
			minutes: undefined,
			defaultNote: 'npm has no default gate',
		})
	})

	it('converts the other managers to minutes', () => {
		expect(readReleaseAgeGate(repo({ 'yarn.lock': '', '.yarnrc.yml': 'npmMinimalAgeGate: 3d\n' }))?.minutes).toBe(4320)
		expect(
			readReleaseAgeGate(repo({ 'bun.lock': '', 'bunfig.toml': '[install]\nminimumReleaseAge = 86400\n' }))?.minutes,
		).toBe(1440)
	})
})
