import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from '@jest/globals'
import { findHarnessDoctor, readDoctorRun } from './harness-doctor.js'

const dirs: string[] = []
afterEach(() => {
	for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

function repoWith(manifest: string | undefined): string {
	const dir = mkdtempSync(join(tmpdir(), 'harness-doctor-'))
	dirs.push(dir)
	if (manifest !== undefined) {
		mkdirSync(join(dir, 'node_modules', 'buddy-agent-harness'), { recursive: true })
		writeFileSync(join(dir, 'node_modules', 'buddy-agent-harness', 'package.json'), manifest)
	}
	return dir
}

describe('findHarnessDoctor', () => {
	it('is undefined when buddy-agent-harness is not installed', () => {
		expect(findHarnessDoctor(repoWith(undefined))).toBeUndefined()
	})

	it('resolves the CLI entry from the bin map or a bin string', () => {
		const dir = repoWith(JSON.stringify({ bin: { 'buddy-agent-harness': './bin/cli.mjs' } }))
		expect(findHarnessDoctor(dir)).toBe(join(dir, 'node_modules', 'buddy-agent-harness', 'bin', 'cli.mjs'))
		const other = repoWith(JSON.stringify({ bin: 'bin/cli.mjs' }))
		expect(findHarnessDoctor(other)).toBe(join(other, 'node_modules', 'buddy-agent-harness', 'bin', 'cli.mjs'))
	})

	it('is undefined when the manifest names no bin or is not JSON', () => {
		expect(findHarnessDoctor(repoWith('{}'))).toBeUndefined()
		expect(findHarnessDoctor(repoWith('not json'))).toBeUndefined()
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
