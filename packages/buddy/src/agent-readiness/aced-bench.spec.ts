import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import { BASELINE_FILE, baselineAgeDays, handover, readBaselineAt } from './aced-bench.js'

let dir: string
beforeEach(() => {
	dir = mkdtempSync(join(tmpdir(), 'agent-readiness-aced-'))
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('readBaselineAt', () => {
	const write = (content: string) => {
		mkdirSync(join(dir, BASELINE_FILE, '..'), { recursive: true })
		writeFileSync(join(dir, BASELINE_FILE), content)
	}

	it('reads createdAt from the suite baseline', () => {
		expect(readBaselineAt(dir)).toBeUndefined()
		write(JSON.stringify({ schemaVersion: 3, createdAt: '2026-09-01T00:00:00.000Z' }))
		expect(readBaselineAt(dir)).toBe('2026-09-01T00:00:00.000Z')
	})

	it.each(['not json', '{}', '{"createdAt":1}'])('treats %s as no baseline', (content) => {
		write(content)
		expect(readBaselineAt(dir)).toBeUndefined()
	})
})

it('counts whole days', () => {
	expect(baselineAgeDays('2026-09-01T00:00:00.000Z', new Date('2026-09-11T23:00:00.000Z'))).toBe(10)
})

describe('handover', () => {
	it('names the suite and the engine', () => {
		expect(handover(dir)).toMatch(/npx -y -p cyber-aced@\^0\.4\.0 aced-bench plan --suite repobuddy\.readiness/)
		expect(handover(dir)).not.toMatch(/git mv/)
	})

	it('says how to move an old task set', () => {
		mkdirSync(join(dir, '.agents/readiness/bench'), { recursive: true })
		expect(handover(dir)).toMatch(/git mv \.agents\/readiness\/bench \.agents\/aced\/bench\/repobuddy\.readiness/)
	})
})
