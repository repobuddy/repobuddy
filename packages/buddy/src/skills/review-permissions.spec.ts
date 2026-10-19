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

type Settings = Record<string, unknown>

/** Scan a throwaway project with Claude Code settings at user, project, and local scope. */
function scanScopes(files: { user?: Settings; project?: Settings; local?: Settings }, args: string[] = []): Report {
	const root = mkdtempSync(join(tmpdir(), 'review-permissions-'))
	dirs.push(root)
	const home = join(root, 'home')
	const project = join(root, 'project')
	mkdirSync(join(home, '.claude'), { recursive: true })
	mkdirSync(join(project, '.claude'), { recursive: true })
	if (files.user) writeFileSync(join(home, '.claude', 'settings.json'), JSON.stringify(files.user))
	if (files.project) writeFileSync(join(project, '.claude', 'settings.json'), JSON.stringify(files.project))
	if (files.local) writeFileSync(join(project, '.claude', 'settings.local.json'), JSON.stringify(files.local))
	const r = spawnSync('node', [SCANNER, project, '--json', ...args], {
		encoding: 'utf8',
		env: { ...process.env, HOME: home, USERPROFILE: home },
	})
	expect(r.status).toBe(0)
	return JSON.parse(r.stdout)
}

const codes = (report: Report, code: string) => report.findings.filter((f) => f.code === code)

describe('scan-permissions.mjs auto mode', () => {
	const outward = [
		'Bash(git push *)',
		'Bash(gh pr merge *)',
		'Bash(gh api *)',
		'Bash(gh workflow run *)',
		'Bash(gh release create *)',
		'Bash(pnpm publish *)',
		'Bash(pnpm changeset publish *)',
		'Bash(gh *)',
	]

	it('flags outward-facing allow rules when defaultMode is auto', () => {
		const report = scanScopes({
			user: { permissions: { defaultMode: 'auto', allow: [...outward, 'Bash(git add *)', 'Bash(gh pr view *)'] } },
		})
		const flagged = codes(report, 'auto-outward-allow').map((f) => f.title)
		for (const raw of outward) expect(flagged.some((t) => t.includes(raw))).toBe(true)
		expect(flagged.some((t) => t.includes('git add'))).toBe(false)
		expect(flagged.some((t) => t.includes('gh pr view'))).toBe(false)
	})

	it('says a merge allow rule hides the merge from the classifier', () => {
		const report = scanScopes({ user: { permissions: { defaultMode: 'auto', allow: ['Bash(gh pr merge *)'] } } })
		const [merge] = codes(report, 'auto-outward-allow')
		expect(merge?.fix).toContain('permissions.ask')
		expect(JSON.stringify(merge)).toContain('Merge Without Review')
	})

	it('flags outward-facing allow rules when --mode auto is passed', () => {
		const report = scanScopes({ user: { permissions: { allow: ['Bash(git push *)'] } } }, ['--mode', 'auto'])
		expect(codes(report, 'auto-outward-allow')).toHaveLength(1)
		const eq = scanScopes({ user: { permissions: { allow: ['Bash(git push *)'] } } }, ['--mode=auto'])
		expect(codes(eq, 'auto-outward-allow')).toHaveLength(1)
	})

	it('does not flag outward-facing allow rules outside auto mode', () => {
		const report = scanScopes({ user: { permissions: { allow: ['Bash(git push *)'] } } })
		expect(codes(report, 'auto-outward-allow')).toHaveLength(0)
	})

	it('notes that classifyAllShell suspends the shell allow rules instead', () => {
		const report = scanScopes({
			user: { permissions: { defaultMode: 'auto', allow: ['Bash(git push *)'] }, autoMode: { classifyAllShell: true } },
		})
		expect(codes(report, 'auto-outward-allow')).toHaveLength(0)
		expect(codes(report, 'automode-classify-all-shell')).toHaveLength(1)
	})

	it('names the broad rules auto mode drops', () => {
		const report = scanScopes({
			user: {
				permissions: {
					defaultMode: 'auto',
					allow: ['Bash(*)', 'Bash(python*)', 'Bash(npm run *)', 'Agent', 'Monitor', 'Bash(npm test)'],
				},
			},
		})
		const dropped = codes(report, 'auto-dropped-allow').map((f) => f.title)
		expect(dropped).toHaveLength(5)
		expect(dropped.some((t) => t.includes('npm test'))).toBe(false)
	})

	it('flags an autoMode block in project settings, where the classifier ignores it', () => {
		const report = scanScopes({
			project: { autoMode: { allow: ['$defaults', 'anything'] } },
			local: { autoMode: { environment: ['Source control: acme'] } },
		})
		expect(codes(report, 'automode-ignored')).toHaveLength(2)
	})

	it('flags soft_deny or hard_deny lists that drop the built-in rules', () => {
		const report = scanScopes({
			user: { autoMode: { soft_deny: ['Never touch prod'], hard_deny: ['$defaults', 'x'], environment: ['y'] } },
		})
		const dropped = codes(report, 'automode-no-defaults')
		expect(dropped).toHaveLength(1)
		expect(dropped[0]?.title).toContain('soft_deny')
		expect(dropped[0]?.level).toBe('high')
	})

	it('flags template text left in an environment or allow entry', () => {
		const report = scanScopes({
			user: {
				autoMode: {
					environment: [
						'$defaults',
						'Organization: {COMPANY_NAME}',
						'Host containment: if it runs in a container, say so here',
						'Source control: the GitHub organization acme',
					],
					allow: [
						'$defaults',
						'Merging in a repo owned by <owners>',
						'Checkouts live at `~/code/<namespace>/<repo>`, and app settings at https://github.com/organizations/<org>/settings',
					],
				},
			},
		})
		expect(codes(report, 'automode-template-text')).toHaveLength(3)
	})

	it('flags a git stash wildcard, which admits drop and clear', () => {
		const report = scan({ allow: ['Bash(git stash *)', 'Bash(git stash push *)'] })
		expect(levelOf(report, 'Bash(git stash *)')).toBe('medium')
		expect(levelOf(report, 'Bash(git stash push *)')).toBe('low')
	})
})
