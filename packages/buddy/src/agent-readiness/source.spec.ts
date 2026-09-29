import { describe, expect, it } from '@jest/globals'
import { findNameCollisions, GREP_FLOOD_FILES, isScannedSource, measureComments, scanComments } from './source.js'

describe('isScannedSource', () => {
	it('takes non-test source in languages with // comments', () => {
		expect(isScannedSource('src/a.ts')).toBe(true)
		expect(isScannedSource('crates/x/src/lib.rs')).toBe(true)
		expect(isScannedSource('src/a.spec.ts')).toBe(false)
		expect(isScannedSource('src/__tests__/a.ts')).toBe(false)
		expect(isScannedSource('test/a.js')).toBe(false)
		expect(isScannedSource('pkg/a_test.go')).toBe(false)
		expect(isScannedSource('types/a.d.ts')).toBe(false)
		expect(isScannedSource('README.md')).toBe(false)
		expect(isScannedSource('script.py')).toBe(false)
	})
})

describe('scanComments', () => {
	it('counts comment-only lines apart from code, and a trailing comment as code', () => {
		const text = ['// one', '/*', ' * two', ' */', '', 'const a = 1 // trailing', 'foo()'].join('\n')
		expect(scanComments(text)).toEqual({ codeLines: 2, commentLines: 4, orphanedJsdoc: [] })
	})

	it('does not take // or /* inside strings, templates, or regex literals for comments', () => {
		const text = [
			"const a = 'http://x'",
			'const b = "/* no */"',
			'const c = `line',
			'// still template`',
			'const d = /https?:\\/\\//.test(a)',
			'const e = x.replace(/["\']/g, "")',
			'const f = n / 2 // real',
			'return /a\\/b/',
		].join('\n')
		expect(scanComments(text)).toEqual({ codeLines: 8, commentLines: 0, orphanedJsdoc: [] })
	})

	it('reads an unclosed quote as a Rust lifetime, not a string', () => {
		expect(scanComments("fn a<'a>(x: &'a str) {}\n// comment").commentLines).toBe(1)
		expect(scanComments("fn a<'a>(x: &str) {} // not a string").codeLines).toBe(1)
	})

	it('flags JSDoc followed by another JSDoc block, a closing brace, or the end of the file', () => {
		const text = [
			'/** header */',
			'import x from "x"',
			'/** stale */',
			'/** real */',
			'export function a() {',
			'  /** dangling */',
			'}',
			'/** @module */',
			'/** doc */',
			'// biome-ignore lint: reason',
			'export const b = 1',
			'/**/',
			'/** end */',
		].join('\n')
		expect(scanComments(text).orphanedJsdoc).toEqual([3, 6, 13])
	})

	it('does not flag a file header followed by a documented declaration, even after the imports', () => {
		expect(scanComments('/** file */\n/** doc */\nexport const a = 1').orphanedJsdoc).toEqual([])
		expect(scanComments("import x from 'x'\n/** file */\n/** doc */\nconst a = 1").orphanedJsdoc).toEqual([])
		expect(scanComments('const a = 1\n/** stale */\n/** doc */\nconst b = 1').orphanedJsdoc).toEqual([2])
	})

	it('treats an unclosed block comment as running to the end', () => {
		expect(scanComments('a()\n/* open\nmore')).toEqual({ codeLines: 1, commentLines: 2, orphanedJsdoc: [] })
	})
})

describe('measureComments', () => {
	it('totals the scanned files and lists the most commented first', () => {
		const texts: Record<string, string> = {
			'a.ts': '// 1\n// 2\nx()',
			'b.ts': '// 1\ny()',
			'c.ts': 'z()',
			'a.spec.ts': '// ignored',
			'README.md': '// ignored',
		}
		expect(measureComments(Object.keys(texts), (p) => texts[p])).toEqual({
			files: 3,
			codeLines: 3,
			commentLines: 3,
			heaviest: [
				{ path: 'a.ts', commentLines: 2, codeLines: 1 },
				{ path: 'b.ts', commentLines: 1, codeLines: 1 },
			],
			orphanedJsdoc: [],
		})
	})

	it('is undefined without scanned source, and skips unreadable files', () => {
		expect(measureComments(['README.md'], () => '')).toBeUndefined()
		expect(measureComments(['a.ts'], () => undefined)).toMatchObject({ files: 1, codeLines: 0 })
	})
})

describe('findNameCollisions', () => {
	function tree(files: Record<string, string>, matches: Record<string, number>) {
		const all = { ...files }
		for (const [word, count] of Object.entries(matches)) {
			for (let i = 0; i < count; i++) all[`docs/${word}-${i}.md`] = word
		}
		return findNameCollisions(Object.keys(all), (p) => all[p])
	}

	it('reports generic names and names declared in several files once a grep would flood', () => {
		const result = tree(
			{
				'src/a.ts': 'export function run() {}\nexport const loadUser = 1\nconst unique = 2',
				'src/b.ts': 'export async function loadUser() {}\nexport default class Thing {}',
				'src/utils.ts': 'export {}',
			},
			{ run: GREP_FLOOD_FILES, loadUser: GREP_FLOOD_FILES, unique: GREP_FLOOD_FILES, utils: 3 },
		)
		expect(result).toEqual([
			{ name: 'loadUser', declaredIn: 2, matchingFiles: GREP_FLOOD_FILES + 2 },
			{ name: 'run', declaredIn: 1, matchingFiles: GREP_FLOOD_FILES + 1 },
		])
	})

	it('ignores declarations in tests and non-JS source', () => {
		expect(tree({ 'src/a.spec.ts': 'export function run() {}', 'src/a.rs': 'x' }, { run: 20 })).toBeUndefined()
		expect(tree({ 'src/a.ts': 'export const specific = 1' }, {})).toEqual([])
	})
})
