import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from '@jest/globals'

const SCANNER = join(import.meta.dirname, '..', '..', 'skills', 'review-permissions', 'scripts', 'scan-permissions.mjs')

type Report = {
	findings: Array<{ level: string; code: string; title: string; fix: string }>
	inventory: Array<{ raw: string; effect: string; level?: string }>
}

const dirs: string[] = []
afterEach(() => {
	for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

/** Scan a throwaway project whose only config is a Claude Code project settings file. */
function scan(permissions: { allow?: string[]; deny?: string[] }): Report {
	const root = mkdtempSync(join(tmpdir(), 'review-permissions-'))
	dirs.push(root)
	const home = join(root, 'home')
	const project = join(root, 'project')
	mkdirSync(home)
	mkdirSync(join(project, '.claude'), { recursive: true })
	writeFileSync(join(project, '.claude', 'settings.json'), JSON.stringify({ permissions }))
	const r = spawnSync('node', [SCANNER, project, '--json'], {
		encoding: 'utf8',
		env: { ...process.env, HOME: home, USERPROFILE: home },
	})
	expect(r.status).toBe(0)
	return JSON.parse(r.stdout)
}

const levelOf = (report: Report, raw: string) => report.inventory.find((r) => r.raw === raw)?.level

describe('scan-permissions.mjs force-push handling', () => {
	it('scores --force-with-lease below a plain force-push', () => {
		const report = scan({
			allow: [
				'Bash(git push --force *)',
				'Bash(git push -f *)',
				'Bash(git push --force-with-lease *)',
				'Bash(git push --force-if-includes *)',
			],
		})
		expect(levelOf(report, 'Bash(git push --force *)')).toBe('high')
		expect(levelOf(report, 'Bash(git push -f *)')).toBe('high')
		expect(levelOf(report, 'Bash(git push --force-with-lease *)')).toBe('medium')
		expect(levelOf(report, 'Bash(git push --force-if-includes *)')).toBe('medium')
	})

	it('recommends deny rules that leave --force-with-lease allowed', () => {
		const report = scan({ allow: ['Bash(git status)'] })
		const baseline = report.findings.find((f) => f.code === 'deny-baseline')
		expect(baseline?.fix).toContain('`Bash(git push --force *)`')
		expect(baseline?.fix).toContain('`Bash(git push -f *)`')
		expect(baseline?.fix).not.toContain('--force*')
	})

	it('accepts a -f deny rule as covering force-pushes', () => {
		const report = scan({ deny: ['Bash(git push -f *)'] })
		const baseline = report.findings.find((f) => f.code === 'deny-baseline')
		expect(baseline?.fix).not.toContain('git push')
	})

	it('flags an existing --force* deny rule that also blocks --force-with-lease', () => {
		const report = scan({ deny: ['Bash(git push --force*)'] })
		const overmatch = report.findings.filter((f) => f.code === 'deny-overmatch')
		expect(overmatch).toHaveLength(1)
		expect(overmatch[0]?.title).toContain('--force-with-lease')
		expect(overmatch[0]?.fix).toContain('`Bash(git push --force *)`')
	})

	it('flags a trailing --force* deny rule and suggests the word-bounded pair', () => {
		const report = scan({ deny: ['Bash(git push * --force*)'] })
		const overmatch = report.findings.filter((f) => f.code === 'deny-overmatch')
		expect(overmatch).toHaveLength(1)
		expect(overmatch[0]?.title).toContain('--force-with-lease')
		expect(overmatch[0]?.fix).toContain('`Bash(git push * --force)`')
		expect(overmatch[0]?.fix).toContain('`Bash(git push * --force *)`')
		expect(overmatch[0]?.fix).not.toContain('--force*')
	})

	it('does not flag the word-bounded deny rules', () => {
		const report = scan({
			deny: [
				'Bash(git push --force *)',
				'Bash(git push -f *)',
				'Bash(git push * --force)',
				'Bash(git push * --force *)',
				'Bash(git push * -f)',
				'Bash(git push * -f *)',
			],
		})
		expect(report.findings.some((f) => f.code === 'deny-overmatch')).toBe(false)
	})
})
