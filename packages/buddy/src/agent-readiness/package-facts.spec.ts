import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from '@jest/globals'
import { collectPackageFacts } from './package-facts.js'

const dirs: string[] = []

function pkg(files: Record<string, string>, { git = false } = {}) {
	const dir = mkdtempSync(join(tmpdir(), 'agent-readiness-pkg-'))
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

const manifest = (fields: object) => JSON.stringify({ name: 'x', ...fields })

describe('collectPackageFacts', () => {
	it('follows re-exports from the declared types and reads the public surface', () => {
		const facts = collectPackageFacts(
			pkg({
				'package.json': manifest({ exports: { '.': { types: './dist/index.d.ts', default: './dist/index.js' } } }),
				'dist/index.d.ts': [
					"export * from './a.js'",
					"export { b } from './b'",
					"import x from 'external'",
					'/** Documented. */',
					'export declare function one(): void',
					'export declare const two: number',
				].join('\n'),
				'dist/a.d.ts': [
					'/**',
					' * Multi-line doc.',
					' * @deprecated use `one`',
					' */',
					'export declare function a(x: any): string',
					"export declare const note = 'any // not code'",
				].join('\n'),
				'dist/b/index.d.ts': '/* not jsdoc */\nexport interface b {}',
			}),
		)
		expect(facts.declarationEntries).toEqual(['dist/index.d.ts'])
		expect(facts.missingDeclarations).toEqual([])
		expect(facts.declarationFiles).toEqual(['dist/index.d.ts', 'dist/a.d.ts', 'dist/b/index.d.ts'])
		expect(facts.exportedSymbols).toEqual([
			{ file: 'dist/index.d.ts', name: 'one', documented: true },
			{ file: 'dist/index.d.ts', name: 'two', documented: false },
			{ file: 'dist/a.d.ts', name: 'a', documented: true },
			{ file: 'dist/a.d.ts', name: 'note', documented: false },
			{ file: 'dist/b/index.d.ts', name: 'b', documented: false },
		])
		expect(facts.anyUsages).toEqual(['dist/a.d.ts:5'])
		expect(facts.deprecatedTags).toBe(1)
		expect(facts.declarationTokens).toBeGreaterThan(0)
		expect(facts.exportsProblems).toEqual([])
	})

	it('reads the export list at the end of a bundled declaration file', () => {
		const facts = collectPackageFacts(
			pkg({
				'package.json': manifest({ types: './index.d.ts' }),
				'index.d.ts': [
					'/** Overload doc. */',
					'declare function f(a: string): void',
					'declare function f(a: number): void',
					'type T = string',
					'declare const internal: number',
					'export { f, type T as Tee }',
				].join('\n'),
			}),
		)
		expect(facts.exportedSymbols).toEqual([
			{ file: 'index.d.ts', name: 'f', documented: true },
			{ file: 'index.d.ts', name: 'T', documented: false },
		])
	})

	it('names declared entries that are not built yet', () => {
		const facts = collectPackageFacts(pkg({ 'package.json': manifest({ types: 'esm/index.d.ts' }) }))
		expect(facts.declarationEntries).toEqual(['esm/index.d.ts'])
		expect(facts.missingDeclarations).toEqual(['esm/index.d.ts'])
		expect(facts.declarationFiles).toEqual([])
	})

	it('falls back to a declaration beside each code entry when no `types` is declared', () => {
		const facts = collectPackageFacts(
			pkg({
				'package.json': manifest({ exports: { import: './a.mjs', require: './a.cjs' }, main: './a.js' }),
				'a.d.mts': 'export {}',
				'a.d.ts': 'export {}',
			}),
		)
		expect(facts.declarationEntries.sort()).toEqual(['a.d.mts', 'a.d.ts'])
	})

	it('flags `types` placed after another condition, and a `./*` subpath', () => {
		const facts = collectPackageFacts(
			pkg({
				'package.json': manifest({
					exports: {
						'.': { import: { default: './i.js', types: './i.d.ts' } },
						'./*': './*',
					},
				}),
			}),
		)
		expect(facts.exportsProblems).toEqual([
			'.: `types` is not the first condition, so resolvers that stop early miss it',
			'`./*` exposes every file, so internals become public API',
		])
	})

	it('reports no exports problems when there is no exports map, and tolerates a bad manifest', () => {
		const facts = collectPackageFacts(pkg({ 'package.json': '{' }))
		expect(facts).toMatchObject({ name: undefined, hasExports: false, exportsProblems: [], entryPoints: [] })
	})

	it('counts the README code examples', () => {
		const readme = ['# x', '```ts', 'one()', '```', '```sh', 'npm i x', '```', '~~~js', 'two()', '~~~'].join('\n')
		const facts = collectPackageFacts(pkg({ 'package.json': manifest({ main: 'x.js' }), 'README.md': readme }))
		expect(facts).toMatchObject({ hasReadme: true, readmeExamples: 2, entryPoints: ['main'] })
	})

	it('parses the changelog and finds major releases with no breaking label', () => {
		const changelog = [
			'# x',
			'## 3.0.0',
			'### Patch Changes',
			'- fix',
			'## 2.0.0',
			'### Major Changes',
			'- removed y',
			'## 1.1.0',
			'## [1.0.0] - 2020-01-01',
			'## 0.1.0',
		].join('\n')
		const facts = collectPackageFacts(pkg({ 'CHANGELOG.md': changelog }))
		expect(facts.changelog).toEqual({ path: 'CHANGELOG.md', versions: 5, unlabelledMajors: ['3.0.0', '1.0.0'] })
		expect(collectPackageFacts(pkg({})).changelog).toBeUndefined()
	})

	it('finds llms.txt in the repo and the scripts and workflows that check it for drift', () => {
		const dir = pkg(
			{
				'package.json': JSON.stringify({ scripts: { 'docs:llms:check': 'gen --check', build: 'tsc' } }),
				'website/public/llms.txt': '# x',
				'.github/workflows/ci.yml': 'run: pnpm llms --check',
				'.github/workflows/other.yml': 'run: pnpm test',
				'packages/x/package.json': JSON.stringify({ scripts: { 'llms-check': 'x' } }),
			},
			{ git: true },
		)
		const facts = collectPackageFacts(join(dir, 'packages/x'))
		expect(facts.llmsTxt).toEqual(['../../website/public/llms.txt'])
		expect(facts.llmsDriftChecks).toEqual([
			'package.json#llms-check',
			'../../package.json#docs:llms:check',
			'../../.github/workflows/ci.yml',
		])
	})

	it('finds llms.txt in the package outside a git repo', () => {
		expect(collectPackageFacts(pkg({ 'llms.txt': '' })).llmsTxt).toEqual(['llms.txt'])
	})

	it('finds shipped agent skills, skipping node_modules', () => {
		const facts = collectPackageFacts(
			pkg({
				'skills/a/SKILL.md': '',
				'skills/a/README.md': '',
				'node_modules/y/skills/b/SKILL.md': '',
				'a/b/c/d/SKILL.md': '',
			}),
		)
		expect(facts.shippedSkills).toEqual(['skills/a/SKILL.md'])
	})
})
