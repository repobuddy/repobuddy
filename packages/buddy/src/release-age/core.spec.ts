import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from '@jest/globals'
import type { Registry } from './core.js'
import { lift, resolveSpec, restore, status } from './core.js'

const now = new Date('2026-09-16T10:00:00Z')
const until = '2026-09-17T10:00:00Z'
const later = new Date('2026-09-18T00:00:00Z')

function repo(file: string, text: string): string {
	const dir = mkdtempSync(join(tmpdir(), 'mra-'))
	writeFileSync(join(dir, file), text)
	return dir
}

test('pnpm: lift appends to existing list, restore removes only the lift', () => {
	const src = `minimumReleaseAge: 1440\nminimumReleaseAgeExclude:\n  - assertron\n  - '@repobuddy/*'\n\nother: 1\n`
	const dir = repo('pnpm-workspace.yaml', src)
	const r = lift(dir, 'pnpm', 'left-pad@1.3.0', { until, now })
	assert.equal(r.ok && r.changed, true)
	const text = readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8')
	assert.match(
		text,
		/ {2}- '@repobuddy\/\*'\n {2}# min-release-age: lift left-pad@1.3.0 until 2026-09-17T10:00:00Z\n {2}- 'left-pad@1.3.0'\n\nother: 1/,
	)
	const s = status(dir, 'pnpm', later)
	assert.equal(s.minutes, 1440)
	assert.deepEqual(s.permanent, ['assertron', '@repobuddy/*'])
	assert.equal(s.lifts[0]?.expired, true)
	const first = restore(dir, 'pnpm', { now })
	assert.equal(first.ok && first.removed.length, 0)
	const second = restore(dir, 'pnpm', { now: later })
	assert.equal(second.ok && second.removed.length, 1)
	assert.equal(readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8'), src)
})

test('pnpm: glob and existing entries count as covered', () => {
	const dir = repo('pnpm-workspace.yaml', `minimumReleaseAgeExclude:\n  - '@repobuddy/*'\n`)
	const r = lift(dir, 'pnpm', '@repobuddy/jest@1.0.0', { until, now })
	assert.equal(r.ok && r.changed, false)
})

test('pnpm: missing key is created; empty list after restore becomes []', () => {
	const dir = repo('pnpm-workspace.yaml', 'packages:\n  - packages/*\n')
	lift(dir, 'pnpm', '@scope/pkg@2.0.0', { until, now })
	assert.equal(status(dir, 'pnpm', now).lifts[0]?.value, '@scope/pkg@2.0.0')
	restore(dir, 'pnpm', { now: later })
	assert.equal(
		readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8'),
		'packages:\n  - packages/*\n\nminimumReleaseAgeExclude: []\n',
	)
})

test('yarn: flow list converted to block', () => {
	const dir = repo('.yarnrc.yml', `npmMinimalAgeGate: 3d\nnpmPreapprovedPackages: [foo, "@a/*"]\n`)
	lift(dir, 'yarn', 'bar@1.0.0', { until, now })
	const s = status(dir, 'yarn', now)
	assert.equal(s.minutes, 4320)
	assert.deepEqual(s.permanent, ['foo', '@a/*'])
	assert.equal(s.lifts[0]?.value, 'bar@1.0.0')
})

test('npm: refuses without --name-wide, then exempts the name', () => {
	const dir = repo('.npmrc', 'min-release-age=2\nmin-release-age-exclude=foo\n')
	assert.equal(lift(dir, 'npm', 'bar@1.0.0', { until, now }).ok, false)
	const r = lift(dir, 'npm', 'bar@1.0.0', { until, now, nameWide: true })
	assert.equal(r.ok && r.changed, true)
	const text = readFileSync(join(dir, '.npmrc'), 'utf8')
	assert.equal(
		text,
		`min-release-age=2\nmin-release-age-exclude[]=foo\n# min-release-age: lift bar@1.0.0 until ${until}\nmin-release-age-exclude[]=bar\n`,
	)
	assert.equal(status(dir, 'npm', now).minutes, 2880)
	restore(dir, 'npm', { now: later })
	assert.deepEqual(status(dir, 'npm', now).lifts, [])
})

test('bun: inline array rewritten, multi-line array gets trailing comma', () => {
	const dir = repo('bunfig.toml', `[install]\nminimumReleaseAge = 86400\nminimumReleaseAgeExcludes = ["foo"]\n`)
	lift(dir, 'bun', 'bar@1.0.0', { until, now, nameWide: true })
	lift(dir, 'bun', 'baz@1.0.0', { until: '2026-09-20T00:00:00Z', now, nameWide: true })
	const s = status(dir, 'bun', later)
	assert.equal(s.minutes, 1440)
	assert.deepEqual(s.permanent, ['foo'])
	assert.deepEqual(
		s.lifts.map((l) => [l.value, l.expired]),
		[
			['bar', true],
			['baz', false],
		],
	)
	restore(dir, 'bun', { now: later })
	assert.equal(
		readFileSync(join(dir, 'bunfig.toml'), 'utf8'),
		`[install]\nminimumReleaseAge = 86400\nminimumReleaseAgeExcludes = [\n  "foo",\n  # min-release-age: lift baz@1.0.0 until 2026-09-20T00:00:00Z\n  "baz",\n]\n`,
	)
	const dir2 = repo('bunfig.toml', `[install]\nminimumReleaseAgeExcludes = [\n  "foo"\n]\n`)
	lift(dir2, 'bun', 'bar@1.0.0', { until, now, nameWide: true })
	assert.match(readFileSync(join(dir2, 'bunfig.toml'), 'utf8'), /"foo",\n {2}# min/)
})

test('restore fails on an orphaned marker', () => {
	const dir = repo(
		'pnpm-workspace.yaml',
		`minimumReleaseAgeExclude:\n  # min-release-age: lift a@1.0.0 until 2026-01-01T00:00:00Z\n  - 'b@1.0.0'\n`,
	)
	assert.equal(restore(dir, 'pnpm', { now }).ok, false)
})

test('lift rejects ranges and already-aged versions', () => {
	const dir = repo('pnpm-workspace.yaml', 'minimumReleaseAge: 1440\n')
	assert.equal(lift(dir, 'pnpm', 'a@^1.0.0', { until, now }).ok, false)
	const r = lift(dir, 'pnpm', 'a@1.0.0', { until: '2026-01-01T00:00:00Z', now })
	assert.equal(r.ok && r.changed, false)
})

const fake: Registry = {
	distTags: (name) => ({ '@s/p': { latest: '2.1.0', next: '3.0.0-beta.1' }, x: { latest: '1.0.0' } })[name] ?? {},
	times: () => ({ '2.1.0': '2026-09-16T08:30:00Z', '3.0.0-beta.1': '2026-09-15T00:00:00Z' }),
}

test('resolveSpec: bare name, scoped name, tag, exact, range', () => {
	assert.deepEqual(resolveSpec('@s/p', fake), { name: '@s/p', version: '2.1.0', tag: 'latest' })
	assert.deepEqual(resolveSpec('@s/p@next', fake), { name: '@s/p', version: '3.0.0-beta.1', tag: 'next' })
	assert.deepEqual(resolveSpec('@s/p@1.2.3-rc.1', fake), { name: '@s/p', version: '1.2.3-rc.1' })
	const range = resolveSpec('@s/p@^1.0.0', fake)
	assert.ok('error' in range && /range/.test(range.error))
	const badTag = resolveSpec('x@beta', fake)
	assert.ok('error' in badTag && /no "beta" dist-tag/.test(badTag.error))
})

test('lift without a version pins latest and computes expiry from publish time', () => {
	const dir = repo('pnpm-workspace.yaml', 'minimumReleaseAge: 1440\n')
	const r = lift(dir, 'pnpm', '@s/p', { now, registry: fake })
	assert.equal(r.ok && r.spec, '@s/p@2.1.0')
	assert.equal(r.ok && r.changed && r.tag, 'latest')
	assert.equal(r.ok && r.changed && r.until, '2026-09-17T09:00:00Z')
	assert.equal(status(dir, 'pnpm', now).lifts[0]?.value, '@s/p@2.1.0')
})
