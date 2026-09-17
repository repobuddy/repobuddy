import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import { main } from './min-release-age.js'

function repo(file: string, text: string): string {
	const dir = mkdtempSync(join(tmpdir(), 'mra-cli-'))
	writeFileSync(join(dir, file), text)
	return dir
}

let stdout: string[]
let stderr: string[]
let stdoutSpy: ReturnType<typeof jest.spyOn>
let stderrSpy: ReturnType<typeof jest.spyOn>
let exitSpy: ReturnType<typeof jest.spyOn>

beforeEach(() => {
	stdout = []
	stderr = []
	stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk: unknown) => {
		stdout.push(String(chunk))
		return true
	})
	stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation((chunk: unknown) => {
		stderr.push(String(chunk))
		return true
	})
	exitSpy = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
		throw new Error(`exit:${code}`)
	}) as never)
})

afterEach(() => {
	stdoutSpy.mockRestore()
	stderrSpy.mockRestore()
	exitSpy.mockRestore()
	jest.restoreAllMocks()
})

test('status: human summary, --json, and --check exits 1 on expired lifts', async () => {
	const dir = repo(
		'pnpm-workspace.yaml',
		`minimumReleaseAge: 1440\nminimumReleaseAgeExclude:\n  # min-release-age: lift a@1.0.0 until 2020-01-01T00:00:00Z\n  - 'a@1.0.0'\n`,
	)
	await main(['status', '--dir', dir])
	assert.match(stdout.join(''), /package manager: pnpm/)
	assert.match(stdout.join(''), /EXPIRED/)

	stdout = []
	await main(['status', '--dir', dir, '--json'])
	const parsed = JSON.parse(stdout.join(''))
	assert.equal(parsed.packageManager, 'pnpm')

	await expect(main(['status', '--dir', dir, '--check'])).rejects.toThrow('exit:1')
})

test('status: unset gate, permanent exemptions, and a detected+installed CI job', async () => {
	const dir = repo('pnpm-workspace.yaml', `minimumReleaseAgeExclude:\n  - assertron\n  - '@repobuddy/*'\n`)
	execSync(`git -C ${dir} init -q && git -C ${dir} remote add origin git@github.com:acme/widgets.git`)
	mkdirSync(join(dir, '.github', 'workflows'), { recursive: true })
	writeFileSync(join(dir, '.github', 'workflows', 'min-release-age.yml'), 'min-release-age')
	await main(['status', '--dir', dir])
	const out = stdout.join('')
	assert.match(out, /gate: minimumReleaseAge = unset/)
	assert.match(out, /permanent: assertron, @repobuddy\/\*/)
	assert.match(out, /git host: github \(git@github\.com:acme\/widgets\.git\)/)
	assert.match(out, /ci systems: github/)
	assert.match(out, /cleanup job: installed \(github,/)
})

test('status: --now pins the reference time', async () => {
	const dir = repo(
		'pnpm-workspace.yaml',
		`minimumReleaseAgeExclude:\n  # min-release-age: lift a@1.0.0 until 2026-09-17T10:00:00Z\n  - 'a@1.0.0'\n`,
	)
	await main(['status', '--dir', dir, '--now', '2026-09-18T00:00:00Z'])
	assert.match(stdout.join(''), /EXPIRED/)
})

test('main: dir defaults to process.cwd() when --dir is omitted', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'mra-cwd-'))
	writeFileSync(join(dir, 'pnpm-workspace.yaml'), 'minimumReleaseAge: 1440\n')
	const original = process.cwd()
	process.chdir(dir)
	try {
		await main(['status'])
	} finally {
		process.chdir(original)
	}
	assert.match(stdout.join(''), /package manager: pnpm/)
})

test('main: default argv is process.argv.slice(2)', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'mra-argv-'))
	writeFileSync(join(dir, 'pnpm-workspace.yaml'), 'minimumReleaseAge: 1440\n')
	const originalArgv = process.argv
	process.argv = [...originalArgv.slice(0, 2), 'status', '--dir', dir]
	try {
		await main()
	} finally {
		process.argv = originalArgv
	}
	assert.match(stdout.join(''), /package manager: pnpm/)
})

test('restore: --github-output is a no-op when GITHUB_OUTPUT is unset', async () => {
	const dir = repo(
		'pnpm-workspace.yaml',
		`minimumReleaseAgeExclude:\n  # min-release-age: lift a@1.0.0 until 2020-01-01T00:00:00Z\n  - 'a@1.0.0'\n`,
	)
	delete process.env['GITHUB_OUTPUT']
	await main(['restore', '--dir', dir, '--github-output'])
	assert.match(stdout.join(''), /^removed 1 expired lift/)
})

test('status: no lifts, no permanent exemptions, ci not installed', async () => {
	const dir = repo('pnpm-workspace.yaml', 'packages:\n  - packages/*\n')
	await main(['status', '--dir', dir])
	const out = stdout.join('')
	assert.match(out, /lifts: none/)
	assert.match(out, /permanent: none/)
	assert.match(out, /not installed/)
})

test('lift: success prints summary, refusal without --name-wide, range rejection', async () => {
	const dir = repo('.npmrc', 'min-release-age=2\n')
	await expect(main(['lift', 'left-pad@1.3.0', '--dir', dir])).rejects.toThrow('exit:1')
	assert.match(stderr.join(''), /--name-wide/)

	stderr = []
	await main(['lift', 'left-pad@1.3.0', '--dir', dir, '--name-wide', '--until', '2026-09-17T10:00:00Z'])
	assert.match(stdout.join(''), /lifted left-pad@1\.3\.0.*whole package name/)

	stdout = []
	stderr = []
	await expect(main(['lift', 'left-pad@^1.0.0', '--dir', dir, '--name-wide'])).rejects.toThrow('exit:1')
	assert.match(stderr.join(''), /range/)
})

test('lift: already exempt reports no change, and --json emits the result', async () => {
	const dir = repo('pnpm-workspace.yaml', `minimumReleaseAgeExclude:\n  - 'left-pad'\n`)
	await main(['lift', 'left-pad@1.3.0', '--dir', dir, '--json'])
	const parsed = JSON.parse(stdout.join(''))
	assert.equal(parsed.ok, true)
	assert.equal(parsed.changed, false)
})

test('lift: a filesystem error while saving is caught and reported as ok:false', async () => {
	if (process.getuid?.() === 0) return // root bypasses the write-permission check this test relies on
	const dir = repo('pnpm-workspace.yaml', 'minimumReleaseAge: 1440\n')
	const file = join(dir, 'pnpm-workspace.yaml')
	const { chmodSync } = await import('node:fs')
	chmodSync(file, 0o400)
	try {
		await expect(main(['lift', 'left-pad@1.3.0', '--dir', dir, '--until', '2026-09-17T10:00:00Z'])).rejects.toThrow(
			'exit:1',
		)
		assert.match(stderr.join(''), /EACCES|permission/i)
	} finally {
		chmodSync(file, 0o600)
	}
})

test('lift: missing spec is a usage error (exit 2)', async () => {
	const dir = repo('pnpm-workspace.yaml', 'minimumReleaseAge: 1440\n')
	await expect(main(['lift', '--dir', dir])).rejects.toThrow('exit:2')
	assert.match(stderr.join(''), /lift needs/)
})

test('restore: --dry-run, --github-output, and --body-file', async () => {
	const dir = repo(
		'pnpm-workspace.yaml',
		`minimumReleaseAgeExclude:\n  # min-release-age: lift a@1.0.0 until 2020-01-01T00:00:00Z\n  - 'a@1.0.0'\n`,
	)
	await main(['restore', '--dir', dir, '--dry-run'])
	assert.match(stdout.join(''), /would remove 1 expired lift/)
	// dry-run must not touch the file
	assert.match(readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8'), /min-release-age: lift/)

	const githubOutput = join(mkdtempSync(join(tmpdir(), 'gh-out-')), 'output')
	writeFileSync(githubOutput, '')
	const bodyFile = join(mkdtempSync(join(tmpdir(), 'body-')), 'body.md')
	process.env['GITHUB_OUTPUT'] = githubOutput
	try {
		stdout = []
		await main(['restore', '--dir', dir, '--github-output', '--body-file', bodyFile])
		assert.match(stdout.join(''), /^removed 1 expired lift/)
		const output = readFileSync(githubOutput, 'utf8')
		assert.match(output, /removed=1/)
		assert.match(output, /body<<__MRA__/)
		const body = readFileSync(bodyFile, 'utf8')
		assert.match(body, /Removes minimum-release-age lifts/)
	} finally {
		delete process.env['GITHUB_OUTPUT']
	}
})

test('restore: nothing to remove, and --json output', async () => {
	const dir = repo('pnpm-workspace.yaml', 'minimumReleaseAge: 1440\n')
	await main(['restore', '--dir', dir, '--json'])
	const parsed = JSON.parse(stdout.join(''))
	assert.equal(parsed.removed.length, 0)
})

test('restore: an orphaned marker is a failure (exit 1)', async () => {
	const dir = repo(
		'pnpm-workspace.yaml',
		`minimumReleaseAgeExclude:\n  # min-release-age: lift a@1.0.0 until 2020-01-01T00:00:00Z\n  - 'b@1.0.0'\n`,
	)
	await expect(main(['restore', '--dir', dir])).rejects.toThrow('exit:1')
	assert.match(stderr.join(''), /is not followed by its entry/)
})

test('open-pr: missing args exits 2; provider error exits 1', async () => {
	await expect(main(['open-pr'])).rejects.toThrow('exit:2')
	assert.match(stderr.join(''), /needs --provider/)

	const bodyFile = join(mkdtempSync(join(tmpdir(), 'body-')), 'body.md')
	writeFileSync(bodyFile, 'hello')
	const originalFetch = global.fetch
	global.fetch = (async () => ({ ok: false, status: 500, text: async () => '{}' })) as unknown as typeof fetch
	try {
		await expect(main(['open-pr', '--provider', 'bitbucket', '--body-file', bodyFile])).rejects.toThrow('exit:1')
	} finally {
		global.fetch = originalFetch
	}
})

test('open-pr: success prints JSON result', async () => {
	const bodyFile = join(mkdtempSync(join(tmpdir(), 'body-')), 'body.md')
	writeFileSync(bodyFile, 'hello')
	const originalFetch = global.fetch
	global.fetch = (async (_url: string | URL | Request, init: RequestInit = {}) => {
		const method = init.method ?? 'GET'
		if (method === 'GET') return { ok: true, status: 200, text: async () => JSON.stringify({ values: [] }) } as Response
		return {
			ok: true,
			status: 200,
			text: async () => JSON.stringify({ links: { html: { href: 'https://x/1' } } }),
		} as Response
	}) as typeof fetch
	process.env['BITBUCKET_WORKSPACE'] = 'w'
	process.env['BITBUCKET_REPO_SLUG'] = 'r'
	process.env['BITBUCKET_BRANCH'] = 'main'
	process.env['MIN_RELEASE_AGE_TOKEN'] = 't'
	try {
		await main(['open-pr', '--provider', 'bitbucket', '--body-file', bodyFile, '--branch', 'chore/restore'])
	} finally {
		global.fetch = originalFetch
		delete process.env['BITBUCKET_WORKSPACE']
		delete process.env['BITBUCKET_REPO_SLUG']
		delete process.env['BITBUCKET_BRANCH']
		delete process.env['MIN_RELEASE_AGE_TOKEN']
	}
	const parsed = JSON.parse(stdout.join(''))
	assert.equal(parsed.ok, true)
	assert.equal(parsed.action, 'created')
})

test('unknown command is a usage error', async () => {
	await expect(main(['bogus'])).rejects.toThrow('exit:2')
	assert.match(stderr.join(''), /unknown command "bogus"/)
})

test('missing/undetectable package manager is a usage error', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'mra-empty-'))
	await expect(main(['status', '--dir', dir])).rejects.toThrow('exit:2')
	assert.match(stderr.join(''), /cannot detect the package manager/)
})

test('parseArgs: a valued flag with no value is a usage error', async () => {
	await expect(main(['status', '--dir'])).rejects.toThrow('exit:2')
	assert.match(stderr.join(''), /--dir needs a value/)
})

test('--pm overrides detection', async () => {
	const dir = mkdtempSync(join(tmpdir(), 'mra-pm-'))
	await main(['status', '--dir', dir, '--pm', 'npm'])
	assert.match(stdout.join(''), /package manager: npm/)
})
