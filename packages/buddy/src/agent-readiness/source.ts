/**
 * Measures the source text itself: how much of it is comment, which JSDoc blocks document nothing,
 * and which declared names flood a grep. The script only counts; whether a comment states a
 * constraint or tells history, and whether a name is worth renaming, stays a judgment.
 */

interface CommentedFile {
	path: string
	commentLines: number
	codeLines: number
}

export interface CommentFacts {
	files: number
	codeLines: number
	/** Lines holding only a comment. A trailing comment on a code line counts as code. */
	commentLines: number
	/** The files with the most comment lines, for the judge to sample from. */
	heaviest: CommentedFile[]
	/** `<path>:<line>` of each JSDoc block followed by another JSDoc block, a closing brace, or the end of the file. */
	orphanedJsdoc: string[]
}

export interface NameCollision {
	name: string
	/** Files declaring it at the top level, or named after it. */
	declaredIn: number
	/** Tracked text files containing it as a whole word: what a grep for it returns. */
	matchingFiles: number
}

/** Languages whose comments are `//` and `/* *\/`. */
const C_STYLE_SOURCE = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|rs|go|java|kt|cs|swift|c|h|cc|cpp|hpp|scss)$/
const JS_SOURCE = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/
const TEST_OR_FIXTURE =
	/(^|\/)(__tests__|__mocks__|__fixtures__|tests?|fixtures?|testcases|e2e)\/|\.(test|spec|stories)\.[^/]+$|_test\.go$/
const DECLARATION_FILE = /\.d\.[mc]?ts$/

/** Names so common that grepping for one returns noise: callers of unrelated functions, properties, prose. */
const GENERIC_NAMES = new Set([
	'common',
	'config',
	'context',
	'create',
	'data',
	'dir',
	'execute',
	'file',
	'format',
	'get',
	'handle',
	'handler',
	'helper',
	'helpers',
	'init',
	'item',
	'items',
	'key',
	'lib',
	'load',
	'main',
	'misc',
	'name',
	'options',
	'opts',
	'parse',
	'path',
	'process',
	'render',
	'result',
	'run',
	'set',
	'setup',
	'shared',
	'start',
	'state',
	'type',
	'update',
	'util',
	'utils',
	'value',
])

/** A name matching fewer files than this costs a grep little, however generic it is. */
export const GREP_FLOOD_FILES = 10
const HEAVIEST_FILES = 5

const TOP_LEVEL_DECLARATION =
	/^(?:export\s+)?(?:default\s+)?(?:declare\s+)?(?:async\s+)?(?:abstract\s+)?(?:function\*?|const|let|var|class|interface|type|enum|namespace)\s+([A-Za-z_$][\w$]*)/gm
const WORD = /[A-Za-z_$][\w$]*/g
/** A `/` after one of these starts a regex literal, not a division. */
const BEFORE_REGEX = new Set([
	'',
	'(',
	',',
	'=',
	':',
	'[',
	'!',
	'&',
	'|',
	'?',
	'{',
	'}',
	';',
	'+',
	'-',
	'*',
	'%',
	'<',
	'>',
	'~',
	'^',
])
const BEFORE_REGEX_WORDS = new Set(['return', 'typeof', 'case', 'in', 'of', 'void', 'yield', 'await'])
const DECLARATION_START =
	/^(?:export\s+)?(?:default\s+)?(?:declare\s+)?(?:async\s+)?(?:abstract\s+)?(?:function|const|let|var|class|interface|type|enum|namespace|fn|func|pub|struct|impl)\b/m
const FILE_LEVEL_TAG = /@(module|file|fileoverview|packageDocumentation|license)\b/

export function isScannedSource(path: string): boolean {
	return C_STYLE_SOURCE.test(path) && !TEST_OR_FIXTURE.test(path) && !DECLARATION_FILE.test(path)
}

interface FileComments {
	codeLines: number
	commentLines: number
	/** 1-based line numbers. */
	orphanedJsdoc: number[]
}

/**
 * A small lexer: enough state (strings, template literals, regex literals, comments) that a `//`
 * inside a string or a URL in a regex is not taken for a comment.
 */
export function scanComments(text: string): FileComments {
	const lineHasCode: boolean[] = []
	const lineHasComment: boolean[] = []
	const jsdocs: Array<{ line: number; start: number; end: number }> = []
	let line = 0
	let lastSignificant = ''
	let lastWord = ''
	const mark = (flags: boolean[]) => {
		flags[line] = true
	}

	let i = 0
	while (i < text.length) {
		const c = text[i] as string
		const next = text[i + 1]
		if (c === '\n') {
			line++
			i++
			continue
		}
		if (c === ' ' || c === '\t' || c === '\r') {
			i++
			continue
		}
		if (c === '/' && next === '/') {
			mark(lineHasComment)
			while (i < text.length && text[i] !== '\n') i++
			continue
		}
		if (c === '/' && next === '*') {
			const startLine = line
			const isJsdoc = text[i + 2] === '*' && text[i + 3] !== '/'
			const close = text.indexOf('*/', i + 2)
			const end = close === -1 ? text.length : close + 2
			for (let j = i; j < end; j++) {
				if (text[j] === '\n') line++
				else if (!/\s/.test(text[j] as string)) mark(lineHasComment)
			}
			if (isJsdoc) jsdocs.push({ line: startLine, start: i, end })
			i = end
			continue
		}
		mark(lineHasCode)
		if (c === '"' || c === "'") {
			let j = i + 1
			while (j < text.length && text[j] !== c && text[j] !== '\n') j += text[j] === '\\' ? 2 : 1
			// An unclosed quote is a Rust lifetime or an apostrophe in JSX text, not a string.
			i = text[j] === c ? j + 1 : i + 1
			lastSignificant = c
			continue
		}
		if (c === '`') {
			i++
			while (i < text.length && text[i] !== '`') {
				if (text[i] === '\\') i++
				if (text[i] === '\n') {
					line++
					mark(lineHasCode)
				}
				i++
			}
			i++
			lastSignificant = c
			continue
		}
		if (
			c === '/' &&
			(BEFORE_REGEX.has(lastSignificant) || (lastSignificant === 'w' && BEFORE_REGEX_WORDS.has(lastWord)))
		) {
			i++
			let inClass = false
			while (i < text.length && text[i] !== '\n' && (inClass || text[i] !== '/')) {
				if (text[i] === '[') inClass = true
				else if (text[i] === ']') inClass = false
				i += text[i] === '\\' ? 2 : 1
			}
			i++
			lastSignificant = '/'
			continue
		}
		if (/[\w$]/.test(c)) {
			const start = i
			while (i < text.length && /[\w$]/.test(text[i] as string)) i++
			lastWord = text.slice(start, i)
			lastSignificant = 'w'
			continue
		}
		lastSignificant = c
		i += c === '\\' ? 2 : 1
	}

	let codeLines = 0
	let commentLines = 0
	for (let n = 0; n <= line; n++) {
		if (lineHasCode[n]) codeLines++
		else if (lineHasComment[n]) commentLines++
	}

	const orphanedJsdoc = jsdocs
		.filter(({ start, end }, index) => {
			// A header before the first declaration, or a tagged module doc, documents the file.
			if (index === 0 && !DECLARATION_START.test(text.slice(0, start))) return false
			if (FILE_LEVEL_TAG.test(text.slice(start, end))) return false
			const next = /\S/g
			next.lastIndex = end
			const at = next.exec(text)?.index
			return at === undefined || text.startsWith('/**', at) || text[at] === '}'
		})
		.map((block) => block.line + 1)

	return { codeLines, commentLines, orphanedJsdoc }
}

export function measureComments(files: string[], read: (path: string) => string | undefined): CommentFacts | undefined {
	const scanned = files.filter(isScannedSource)
	if (scanned.length === 0) return undefined
	let codeLines = 0
	let commentLines = 0
	const perFile: CommentedFile[] = []
	const orphanedJsdoc: string[] = []
	for (const path of scanned) {
		const text = read(path)
		if (text === undefined) continue
		const result = scanComments(text)
		codeLines += result.codeLines
		commentLines += result.commentLines
		perFile.push({ path, commentLines: result.commentLines, codeLines: result.codeLines })
		for (const line of result.orphanedJsdoc) orphanedJsdoc.push(`${path}:${line}`)
	}
	const heaviest = perFile
		.filter((f) => f.commentLines > 0)
		.sort((a, b) => b.commentLines - a.commentLines)
		.slice(0, HEAVIEST_FILES)
	return { files: scanned.length, codeLines, commentLines, heaviest, orphanedJsdoc }
}

function basenameStem(path: string): string {
	const base = path.slice(path.lastIndexOf('/') + 1)
	return base.slice(0, base.indexOf('.') === -1 ? undefined : base.indexOf('.'))
}

/**
 * A name collides when grepping for it returns at least `GREP_FLOOD_FILES` files, and it is either
 * generic or declared at the top level of more than one file. Declarations are read from JS and TS
 * only, since the pattern is theirs; matches are counted in every file given, tests and docs included,
 * because a grep returns those too.
 */
export function findNameCollisions(
	searched: string[],
	read: (path: string) => string | undefined,
): NameCollision[] | undefined {
	const sources = searched.filter((f) => JS_SOURCE.test(f) && isScannedSource(f))
	if (sources.length === 0) return undefined
	const declaredIn = new Map<string, number>()
	const declare = (name: string) => declaredIn.set(name, (declaredIn.get(name) ?? 0) + 1)
	for (const path of sources) {
		const names = new Set<string>()
		for (const m of (read(path) ?? '').matchAll(TOP_LEVEL_DECLARATION)) names.add(m[1] as string)
		const stem = basenameStem(path)
		if (GENERIC_NAMES.has(stem)) names.add(stem)
		for (const name of names) declare(name)
	}

	const candidates = new Map<string, number>()
	for (const [name, count] of declaredIn) {
		if (count > 1 || GENERIC_NAMES.has(name)) candidates.set(name, 0)
	}
	if (candidates.size === 0) return []

	for (const path of searched) {
		const words = new Set((read(path) ?? '').match(WORD))
		for (const word of words) {
			const count = candidates.get(word)
			if (count !== undefined) candidates.set(word, count + 1)
		}
	}

	return [...candidates]
		.filter(([, matchingFiles]) => matchingFiles >= GREP_FLOOD_FILES)
		.map(([name, matchingFiles]) => ({ name, declaredIn: declaredIn.get(name) as number, matchingFiles }))
		.sort((a, b) => b.matchingFiles - a.matchingFiles || a.name.localeCompare(b.name))
}
