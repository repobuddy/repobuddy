import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from '@jest/globals'
import { collectFacts, estimateTokens } from './facts.js'

const dirs: string[] = []

function repo(files: Record<string, string>, { git = true } = {}) {
	const dir = mkdtempSync(join(tmpdir(), 'agent-readiness-'))
	dirs.push(dir)
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(dirname(join(dir, path)), { recursive: true })
		writeFileSync(join(dir, path), content)
	}
	if (git) {
		spawnSync('git', ['init', '-q'], { cwd: dir })
		spawnSync('git', ['add', '-A'], { cwd: dir })
	}
	return dir
}

afterEach(() => {
	for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('estimateTokens', () => {
	it('counts four characters per token, rounded up', () => {
		expect(estimateTokens('')).toBe(0)
		expect(estimateTokens('abcde')).toBe(2)
	})
})

describe('collectFacts', () => {
	it('reads scripts, toolchain pins, and presence signals from a git repo', () => {
		const dir = repo({
			'README.md': '# x',
			'package.json': JSON.stringify({
				packageManager: 'pnpm@10.0.0',
				engines: { node: '>=22' },
				scripts: { test: 'jest', verify: 'x' },
				'lint-staged': {},
			}),
			'pnpm-lock.yaml': '',
			'pnpm-workspace.yaml': '',
			'.nvmrc': '22',
			'.gitignore': '.env\n',
			'.github/workflows/ci.yml': '',
			'.github/ISSUE_TEMPLATE/bug.md': '',
			'CONTRIBUTING.md': '',
			'tsconfig.json': '{ "compilerOptions": { "strict": true } }',
		})
		const facts = collectFacts(dir)
		expect(facts).toMatchObject({
			isGitRepo: true,
			hasReadme: true,
			hasManifest: true,
			ciConfigs: ['.github/workflows'],
			toolchainPins: ['package.json#packageManager', '.nvmrc', 'package.json#engines.node'],
			hasLockfile: true,
			preCommitHooks: ['package.json'],
			hasContributing: true,
			hasIssueTemplates: true,
			isMonorepo: true,
			tsStrict: true,
			envIgnored: true,
		})
		expect(facts.scripts.sort()).toEqual(['test', 'verify'])
	})

	it('reads Makefile targets as scripts', () => {
		expect(collectFacts(repo({ Makefile: 'test:\n\tgo test\ncheck: test\n' })).scripts).toEqual(['test', 'check'])
	})

	it('tolerates an unparsable package.json', () => {
		const facts = collectFacts(repo({ 'package.json': '{' }))
		expect(facts.scripts).toEqual([])
		expect(facts.toolchainPins).toEqual([])
	})

	it('measures instruction files and flags the scripts they name that do not exist', () => {
		const agents = [
			'Run `pnpm verify`, then `pnpm lint`.',
			'`pnpm install` and `pnpm dlx x` are built in; `npm run gone` is not.',
			'`pnpm test` is fine, `make deploy` is not.',
		].join('\n')
		const facts = collectFacts(
			repo({ 'AGENTS.md': agents, 'package.json': JSON.stringify({ scripts: { verify: '', test: '' } }) }),
		)
		expect(facts.instructionFiles).toEqual([{ path: 'AGENTS.md', tokens: estimateTokens(agents) }])
		expect(facts.missingInstructionCommands).toEqual(['pnpm lint', 'npm run gone', 'make deploy'])
	})

	it('counts an instructions file once when another name links to it', () => {
		const dir = repo({ 'AGENTS.md': 'x'.repeat(40) })
		symlinkSync(join(dir, 'AGENTS.md'), join(dir, 'CLAUDE.md'))
		expect(collectFacts(dir).instructionFiles).toEqual([{ path: 'AGENTS.md', tokens: 10 }])
	})

	it('counts each skill description once, following symlinks', () => {
		const dir = repo({
			'.agents/skills/a/SKILL.md': '---\nname: a\ndescription: "Use this skill when x."\n---\nbody',
			'.agents/skills/b/SKILL.md': 'no frontmatter',
			'.agents/skills/c/README.md': 'not a skill',
		})
		mkdirSync(join(dir, '.claude/skills'), { recursive: true })
		symlinkSync(join(dir, '.agents/skills/a'), join(dir, '.claude/skills/a'))
		const skills = collectFacts(dir).skillDescriptions
		expect(skills.map((s) => s.name)).toEqual(['a', 'b'])
		expect(skills[0]?.tokens).toBe(estimateTokens('a: Use this skill when x.'))
	})

	it('finds large hand-written files, build output, and committed secrets among tracked files', () => {
		const long = 'x\n'.repeat(1200)
		const facts = collectFacts(
			repo({
				'src/big.ts': long,
				'CHANGELOG.md': long,
				'dist/index.js': long,
				'vendor/a.min.js': '',
				'.env': 'A=1',
				'.env.example': 'A=',
				'certs/server.pem': '',
			}),
		)
		expect(facts.largeFiles).toEqual([{ path: 'src/big.ts', lines: 1201 }])
		expect(facts.trackedBuildOutput.sort()).toEqual(['dist/index.js', 'vendor/a.min.js'])
		expect(facts.committedSecretFiles.sort()).toEqual(['.env', 'certs/server.pem'])
		expect(facts.envIgnored).toBe(false)
	})

	it('reports literal MCP credentials by file and key, never by value', () => {
		const mcp = {
			mcpServers: {
				// biome-ignore lint/suspicious/noTemplateCurlyInString: an MCP env reference, not a template
				a: { env: { API_KEY: 'sk-live-123', GITHUB_TOKEN: '${GITHUB_TOKEN}', REGION: 'us', PASSWORD: '' } },
				b: {},
			},
		}
		const facts = collectFacts(repo({ '.mcp.json': JSON.stringify(mcp), '.cursor/mcp.json': '{' }))
		expect(facts.mcpLiteralCredentials).toEqual(['.mcp.json: API_KEY'])
	})

	it('reads tsconfig strictness, trusting a shared preset unless strict is turned off locally', () => {
		expect(collectFacts(repo({})).tsStrict).toBeUndefined()
		expect(collectFacts(repo({ 'tsconfig.json': '{ "extends": "@x/tsconfig" }' })).tsStrict).toBe(true)
		expect(collectFacts(repo({ 'tsconfig.json': '{ "strict": false }' })).tsStrict).toBe(false)
		expect(collectFacts(repo({ 'tsconfig.json': '{}' })).tsStrict).toBe(false)
		expect(collectFacts(repo({ 'tsconfig.json': '{ "files": [], "references": [] }' })).tsStrict).toBeUndefined()
	})

	it('walks the tree outside a git repo, skipping node_modules', () => {
		const facts = collectFacts(
			repo({ 'README.md': '', 'node_modules/x/dist/a.js': '', 'dist/b.js': '' }, { git: false }),
		)
		expect(facts.isGitRepo).toBe(false)
		expect(facts.hasReadme).toBe(true)
		expect(facts.trackedBuildOutput).toEqual(['dist/b.js'])
		expect(facts.envIgnored).toBeUndefined()
	})
})
