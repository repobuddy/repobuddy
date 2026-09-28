import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { afterEach, beforeEach, expect, jest, test } from '@jest/globals'
import type { DetectResult } from '../env/detect.js'
import { main, printSummary } from './detect-env.js'

function gitRepo(remotes: [string, string][]): string {
	const dir = mkdtempSync(join(tmpdir(), 'detect-cli-'))
	execFileSync('git', ['-C', dir, 'init', '-q'])
	for (const [name, url] of remotes) execFileSync('git', ['-C', dir, 'remote', 'add', name, url])
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

test('detect-env: human summary for a repo with no remotes', async () => {
	const dir = gitRepo([])
	await main(['--dir', dir])
	const out = stdout.join('')
	assert.match(out, /^os: /)
	assert.match(out, /hosts: none \(no git remotes; pass --host\)/)
})

test('detect-env: --json prints parseable JSON with a github remote', async () => {
	const dir = gitRepo([['origin', 'git@github.com:acme/widgets.git']])
	await main(['--dir', dir, '--json'])
	const parsed = JSON.parse(stdout.join(''))
	assert.equal(parsed.hosts[0].hostname, 'github.com')
})

test('detect-env: --host with a self-hosted, uninstalled CLI prints install options', async () => {
	await main(['--host', 'gitea=git.example.com', '--dir', '.'])
	const out = stdout.join('')
	assert.match(out, /host: git\.example\.com → gitea \(self-hosted\)/)
})

test('detect-env: unknown argument is a usage error', async () => {
	await expect(main(['--bogus'])).rejects.toThrow('exit:2')
	assert.match(stderr.join(''), /unknown argument "--bogus"/)
})

test('detect-env: a valued flag with no value is a usage error', async () => {
	await expect(main(['--dir'])).rejects.toThrow('exit:2')
	assert.match(stderr.join(''), /--dir needs a value/)
})

test('detect-env: installed and authenticated CLI, and an unreadable MCP file is silently skipped', async () => {
	const dir = gitRepo([['origin', 'git@github.com:acme/widgets.git']])
	const binDir = mkdtempSync(join(tmpdir(), 'detect-bin-'))
	const gh = join(binDir, 'gh')
	writeFileSync(gh, '#!/bin/sh\nif [ "$1" = "--version" ]; then echo "gh version 2.4.0"; else exit 0; fi\n')
	chmodSync(gh, 0o755)
	writeFileSync(join(dir, '.mcp.json'), 'not json')
	const originalPath = process.env['PATH']
	process.env['PATH'] = `${binDir}${delimiter}${originalPath}`
	try {
		await main(['--dir', dir])
	} finally {
		process.env['PATH'] = originalPath
	}
	const out = stdout.join('')
	assert.match(out, /cli: gh .*— authenticated/)
	assert.doesNotMatch(out, /unreadable/)
})

test('detect-env: CLI not installed with no install recipe for this machine', async () => {
	await main(['--host', 'bitbucket', '--dir', '.'])
	const out = stdout.join('')
	assert.match(out, /cli: Bitbucket Cloud has no official CLI/)
})

function baseResult(overrides: Partial<DetectResult> = {}): DetectResult {
	return {
		dir: '/repo',
		os: { platform: 'linux', arch: 'x64', release: '', wsl: false, family: 'debian' },
		managers: [],
		hosts: [],
		mcp: [],
		...overrides,
	}
}

test('printSummary: os line covers distro name, bare version, wsl, and no-sudo branches', () => {
	printSummary(
		baseResult({
			os: {
				platform: 'linux',
				arch: 'x64',
				release: '',
				wsl: true,
				family: 'debian',
				distro: { id: 'debian', idLike: null, version: null, name: 'Debian GNU/Linux' },
				sudo: 'passwordless',
			},
		}),
	)
	let out = stdout.join('')
	assert.match(out, /os: debian \(Debian GNU\/Linux\) x64, WSL, sudo: passwordless/)

	stdout = []
	printSummary(
		baseResult({
			os: { platform: 'darwin', arch: 'arm64', release: '', wsl: false, family: 'macos', version: '14.5' },
		}),
	)
	out = stdout.join('')
	assert.match(out, /os: macos 14\.5 arm64$/m)

	stdout = []
	printSummary(baseResult({ os: { platform: 'win32', arch: 'x64', release: '', wsl: false, family: 'windows' } }))
	out = stdout.join('')
	assert.match(out, /^os: windows x64$/m)
})

test('printSummary: host line without a CLI, without remotes, not self-hosted', () => {
	printSummary(baseResult({ hosts: [{ hostname: 'git.example.com', kind: null, remotes: [], selfHosted: false }] }))
	assert.match(stdout.join(''), /host: git\.example\.com → unknown$/m)
})

test('printSummary: cli authenticated / not authenticated / auth-unknown, installed', () => {
	const host = (authenticated: boolean | null) => ({
		hostname: 'github.com',
		kind: 'github' as const,
		remotes: ['origin'],
		selfHosted: false,
		cli: {
			name: 'gh',
			installed: true,
			version: '2.4.0',
			authenticated,
			login: 'gh auth login',
			install: [],
		},
	})
	printSummary(baseResult({ hosts: [host(true)] }))
	assert.match(stdout.join(''), /— authenticated$/m)
	stdout = []
	printSummary(baseResult({ hosts: [host(false)] }))
	assert.match(stdout.join(''), /not authenticated \(run: gh auth login\)$/m)
	stdout = []
	printSummary(baseResult({ hosts: [host(null)] }))
	assert.match(stdout.join(''), /auth unknown$/m)
})

test('printSummary: cli not installed, with and without install recipes, with postInstall', () => {
	printSummary(
		baseResult({
			hosts: [
				{
					hostname: 'dev.azure.com',
					kind: 'azure',
					remotes: [],
					selfHosted: false,
					cli: {
						name: 'az',
						installed: false,
						install: [
							{ manager: 'brew', official: true, sudo: false, commands: ['brew install azure-cli'] },
							{ manager: null, official: false, sudo: false, commands: [], note: 'download it' },
						],
						postInstall: ['az extension add --name azure-devops'],
						docs: 'https://example.com/docs',
					},
				},
			],
		}),
	)
	const out = stdout.join('')
	assert.match(out, /official via brew: brew install azure-cli$/m)
	assert.match(out, /community via download: download it$/m)
	assert.match(out, /then: az extension add --name azure-devops$/m)
	assert.match(out, /docs: https:\/\/example\.com\/docs$/m)

	stdout = []
	printSummary(
		baseResult({
			hosts: [
				{
					hostname: 'tea.example.com',
					kind: 'gitea',
					remotes: [],
					selfHosted: true,
					cli: { name: 'tea', installed: false, install: [], docs: 'https://x' },
				},
			],
		}),
	)
	assert.match(stdout.join(''), /no install recipe for this machine/)
})

test('printSummary: mcp entry with a command (no url) and disabled', () => {
	printSummary(
		baseResult({
			mcp: [
				{
					name: 'gh-mcp',
					transport: 'stdio',
					command: 'npx',
					args: ['github-mcp-server'],
					url: null,
					disabled: true,
					harness: 'claude-code',
					file: '/home/x/.claude.json',
					scope: 'user',
					hosts: ['github'],
				},
			],
		}),
	)
	const out = stdout.join('')
	assert.match(out, /gh-mcp \(github\) — claude-code user, npx github-mcp-server, disabled$/m)
})

test('detect-env: default argv is process.argv.slice(2)', async () => {
	const originalArgv = process.argv
	process.argv = [...originalArgv.slice(0, 2), '--dir', gitRepo([])]
	try {
		await main()
		assert.match(stdout.join(''), /^os: /)
	} finally {
		process.argv = originalArgv
	}
})
