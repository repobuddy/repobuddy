import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from '@jest/globals'
import { findHarnessDoctor, readDoctorRun, runHarnessDoctor } from './harness-doctor.js'

const dirs: string[] = []
afterEach(() => {
	for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

function repo(files: Record<string, string>): string {
	const dir = mkdtempSync(join(tmpdir(), 'harness-doctor-'))
	dirs.push(dir)
	for (const [path, text] of Object.entries(files)) {
		mkdirSync(dirname(join(dir, path)), { recursive: true })
		writeFileSync(join(dir, path), text)
	}
	return dir
}

const harnessManifest = JSON.stringify({ name: 'buddy-agent-harness', bin: { 'buddy-agent-harness': './bin/cli.mjs' } })

describe('findHarnessDoctor', () => {
	it('is undefined when buddy-agent-harness is neither installed nor in the repo', () => {
		expect(findHarnessDoctor(repo({}))).toBeUndefined()
		expect(findHarnessDoctor(repo({ 'package.json': JSON.stringify({ name: 'other' }) }))).toBeUndefined()
	})

	describe('installed dependency', () => {
		it('runs the CLI entry from the bin map or a bin string', () => {
			const dir = repo({ 'node_modules/buddy-agent-harness/package.json': harnessManifest })
			expect(findHarnessDoctor(dir)).toEqual({
				source: 'dependency',
				packageDir: join(dir, 'node_modules', 'buddy-agent-harness'),
				args: [join(dir, 'node_modules', 'buddy-agent-harness', 'bin', 'cli.mjs')],
			})
			const other = repo({ 'node_modules/buddy-agent-harness/package.json': JSON.stringify({ bin: 'bin/cli.mjs' }) })
			expect(findHarnessDoctor(other)?.args).toEqual([
				join(other, 'node_modules', 'buddy-agent-harness', 'bin', 'cli.mjs'),
			])
		})

		it('runs the bin even when the installed package ships `src/cli.ts`: node runs no TypeScript under node_modules', () => {
			const dir = repo({
				'node_modules/buddy-agent-harness/package.json': harnessManifest,
				'node_modules/buddy-agent-harness/src/cli.ts': '',
			})
			expect(findHarnessDoctor(dir)?.args).toEqual([join(dir, 'node_modules', 'buddy-agent-harness', 'bin', 'cli.mjs')])
		})

		it('is undefined when the manifest names no bin or is not JSON', () => {
			expect(findHarnessDoctor(repo({ 'node_modules/buddy-agent-harness/package.json': '{}' }))).toBeUndefined()
			expect(findHarnessDoctor(repo({ 'node_modules/buddy-agent-harness/package.json': 'not json' }))).toBeUndefined()
		})
	})

	describe('the repo itself', () => {
		it('runs its own source, which needs no build', () => {
			const dir = repo({ 'package.json': harnessManifest, 'src/cli.ts': '' })
			const doctor = findHarnessDoctor(dir)
			expect(doctor).toMatchObject({ source: 'repo', packageDir: dir })
			expect(doctor?.args.slice(0, 3)).toEqual(['--experimental-transform-types', '--input-type=module', '-e'])
			expect(doctor?.args[3]).toContain(JSON.stringify(join(dir, 'src', 'cli.ts')))
		})

		it('runs its bin when it has no `src/cli.ts`, or this node cannot run TypeScript', () => {
			const dir = repo({ 'package.json': harnessManifest })
			expect(findHarnessDoctor(dir)).toEqual({ source: 'repo', packageDir: dir, args: [join(dir, 'bin', 'cli.mjs')] })
			const withSource = repo({ 'package.json': harnessManifest, 'src/cli.ts': '' })
			expect(findHarnessDoctor(withSource, { transformTypes: false })?.args).toEqual([
				join(withSource, 'bin', 'cli.mjs'),
			])
		})

		it('comes before an installed copy', () => {
			const dir = repo({
				'package.json': harnessManifest,
				'node_modules/buddy-agent-harness/package.json': harnessManifest,
			})
			expect(findHarnessDoctor(dir)?.source).toBe('repo')
		})
	})

	describe('a workspace package', () => {
		it('is found through pnpm-workspace.yaml globs', () => {
			const dir = repo({
				'package.json': JSON.stringify({ name: 'buddy-agent-harness-monorepo', private: true }),
				'pnpm-workspace.yaml': 'packages:\n  - "apps/*"\n  - \'packages/*\'\nallowBuilds:\n  esbuild: true\n',
				'apps/website/package.json': JSON.stringify({ name: 'website' }),
				'packages/buddy-agent-harness/package.json': harnessManifest,
				'packages/buddy-agent-harness/src/cli.ts': '',
			})
			const doctor = findHarnessDoctor(dir)
			expect(doctor).toMatchObject({ source: 'workspace', packageDir: join(dir, 'packages', 'buddy-agent-harness') })
			expect(doctor?.args[3]).toContain(JSON.stringify(join(dir, 'packages', 'buddy-agent-harness', 'src', 'cli.ts')))
		})

		it('is found through package.json workspaces, as an array, an object, or a literal path', () => {
			const files = { 'tools/harness/package.json': harnessManifest }
			for (const workspaces of [['tools/*'], { packages: ['tools/*'] }, ['tools/harness']]) {
				const dir = repo({ ...files, 'package.json': JSON.stringify({ private: true, workspaces }) })
				expect(findHarnessDoctor(dir)).toEqual({
					source: 'workspace',
					packageDir: join(dir, 'tools', 'harness'),
					args: [join(dir, 'tools', 'harness', 'bin', 'cli.mjs')],
				})
			}
		})

		it('skips negated globs and packages that are not buddy-agent-harness', () => {
			const dir = repo({
				'pnpm-workspace.yaml': 'packages:\n  - packages/*\n  - "!packages/buddy-agent-harness"\n',
				'packages/a/package.json': 'not json',
				'packages/b/package.json': JSON.stringify({ name: 'b' }),
			})
			expect(findHarnessDoctor(dir)).toBeUndefined()
		})
	})
})

describe('runHarnessDoctor', () => {
	it('runs the repo source, parameter properties included, with doctor arguments after the program name', () => {
		const dir = repo({
			'package.json': harnessManifest,
			'src/cli.ts': [
				'class Root {',
				'\tconstructor(readonly path: string) {}',
				'}',
				'export async function run(argv: string[]): Promise<number> {',
				'\tconst root = new Root(process.cwd()).path',
				"\tconst ok = argv.length === 7 && argv.slice(2).join(' ') === 'doctor --format json --root ' + root",
				"\tif (ok) process.stdout.write(JSON.stringify({ findings: '0 problems found' }))",
				'\treturn ok ? 0 : 1',
				'}',
				'',
			].join('\n'),
		})
		const doctor = findHarnessDoctor(dir)
		expect(doctor && runHarnessDoctor(dir, doctor)).toEqual({ outcome: 'ok', findings: [] })
	})
})

describe('readDoctorRun', () => {
	it('reads a findings sentence as no findings', () => {
		const out = JSON.stringify({ bridges: [], findings: '0 problems found — all 2 bridges resolve' })
		expect(readDoctorRun(0, out)).toEqual({ outcome: 'ok', findings: [] })
	})

	it('reads each finding, dropping fields it does not use', () => {
		const finding = { path: '.claude/skills', problem: 'missing', detail: 'The bridge does not exist.' }
		const out = JSON.stringify({ findings: [{ ...finding, extra: 1 }], help: [] })
		expect(readDoctorRun(0, out)).toEqual({ outcome: 'ok', findings: [finding] })
	})

	it('reads a failed, timed-out, or unspawned run as an error', () => {
		expect(readDoctorRun(2, '')).toEqual({ outcome: 'error', findings: [], error: 'exit 2' })
		expect(readDoctorRun(null, '')).toMatchObject({ error: 'timed out' })
		expect(readDoctorRun(null, '', 'spawn ENOENT')).toMatchObject({ error: 'spawn ENOENT' })
	})

	it('reads output it cannot parse as an error', () => {
		expect(readDoctorRun(0, 'findings: 0 problems')).toMatchObject({ outcome: 'error', error: 'output is not JSON' })
		expect(readDoctorRun(0, '{"findings":[{"path":1}]}')).toMatchObject({
			outcome: 'error',
			error: 'output has no findings list',
		})
		expect(readDoctorRun(0, 'null')).toMatchObject({ outcome: 'error' })
	})
})
