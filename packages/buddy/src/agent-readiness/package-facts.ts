/**
 * Reads the static facts `score --package` grades from a package directory: either a package's source
 * folder or an installed copy under `node_modules`. A consumer's agent meets a package through what
 * ships, so the declarations, README, changelog, and `llms.txt` are what count here, not the source.
 * Nothing is built, installed, fetched, or run.
 */

import { spawnSync } from 'node:child_process'
import { type Dirent, existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { estimateTokens } from './facts.js'

interface ExportedSymbol {
	/** Declaration file, relative to the package. */
	file: string
	name: string
	documented: boolean
}

export interface PackageFacts {
	name: string | undefined
	hasReadme: boolean
	/** Fenced JavaScript or TypeScript blocks in the README. */
	readmeExamples: number
	/** `exports`, `main`, `module`, or `bin`, whichever the manifest declares. */
	entryPoints: string[]
	hasExports: boolean
	/** Ways the `exports` map misleads a resolver or exposes internals. */
	exportsProblems: string[]
	/** Declaration files the manifest points at, relative to the package. */
	declarationEntries: string[]
	/** Declaration entries that are not on disk, typically because the package is not built. */
	missingDeclarations: string[]
	/** Declaration files reachable from the entries through relative re-exports. */
	declarationFiles: string[]
	exportedSymbols: ExportedSymbol[]
	/** `<file>:<line>` for each `any` in the public declarations. */
	anyUsages: string[]
	deprecatedTags: number
	declarationTokens: number
	/** `undefined` when the package has no CHANGELOG.md. */
	changelog: { path: string; versions: number; unlabelledMajors: string[] } | undefined
	/** `llms.txt` files in the package or its repository. */
	llmsTxt: string[]
	/** Scripts or CI workflows that check `llms.txt` for drift. */
	llmsDriftChecks: string[]
	/** Agent skills the package ships (`SKILL.md` files), relative to the package. */
	shippedSkills: string[]
}

interface Manifest {
	name?: unknown
	types?: unknown
	typings?: unknown
	main?: unknown
	module?: unknown
	bin?: unknown
	exports?: unknown
	scripts?: Record<string, unknown>
}

function read(path: string): string | undefined {
	try {
		return readFileSync(path, 'utf8')
	} catch {
		return undefined
	}
}

function readManifest(dir: string): Manifest {
	try {
		return JSON.parse(read(join(dir, 'package.json')) ?? '{}')
	} catch {
		return {}
	}
}

/** Relative path with a leading `./` stripped, the way the report names files. */
function clean(path: string): string {
	return path.replace(/^\.\//, '')
}

/** Every string target in an `exports` value, and the conditions objects it contains. */
function walkExports(
	value: unknown,
	key: string,
	visit: (target: string, condition: string) => void,
	visitConditions: (subpath: string, conditions: string[]) => void,
	subpath = '.',
): void {
	if (typeof value === 'string') visit(value, key)
	else if (Array.isArray(value)) for (const v of value) walkExports(v, key, visit, visitConditions, subpath)
	else if (value && typeof value === 'object') {
		const keys = Object.keys(value)
		const isSubpathMap = keys.every((k) => k.startsWith('.'))
		if (!isSubpathMap) visitConditions(subpath, keys)
		for (const [k, v] of Object.entries(value)) {
			walkExports(v, isSubpathMap ? key : k, visit, visitConditions, isSubpathMap ? k : subpath)
		}
	}
}

function readExports(pkg: Manifest) {
	const typesTargets: string[] = []
	const codeTargets: string[] = []
	const problems: string[] = []
	walkExports(
		pkg.exports,
		'default',
		(target, condition) => (condition === 'types' ? typesTargets : codeTargets).push(target),
		(subpath, conditions) => {
			if (conditions.includes('types') && conditions[0] !== 'types') {
				problems.push(`${subpath}: \`types\` is not the first condition, so resolvers that stop early miss it`)
			}
		},
	)
	if (pkg.exports && typeof pkg.exports === 'object' && !Array.isArray(pkg.exports)) {
		if (Object.keys(pkg.exports).some((k) => k === './*' || k === './')) {
			problems.push('`./*` exposes every file, so internals become public API')
		}
	}
	return { typesTargets, codeTargets, problems }
}

const DECLARATION_OF: Array<[RegExp, string]> = [
	[/\.d\.[mc]?ts$/, ''],
	[/\.mjs$/, '.d.mts'],
	[/\.cjs$/, '.d.cts'],
	[/\.jsx?$/, '.d.ts'],
	[/\.m?tsx?$/, '.d.ts'],
]

/** The declaration file TypeScript would load beside a code file. */
function declarationBeside(target: string): string {
	for (const [pattern, ext] of DECLARATION_OF) {
		if (pattern.test(target)) return ext === '' ? target : target.replace(pattern, ext)
	}
	return `${target}.d.ts`
}

function findDeclarationEntries(dir: string, pkg: Manifest): string[] {
	const { typesTargets, codeTargets } = readExports(pkg)
	const entries = new Set<string>()
	for (const field of [pkg.types, pkg.typings]) if (typeof field === 'string') entries.add(clean(field))
	for (const t of typesTargets) entries.add(clean(t))
	if (entries.size === 0) {
		// No explicit `types`: TypeScript falls back to a declaration file beside each code entry.
		const code = [...codeTargets, ...[pkg.main, pkg.module].filter((v): v is string => typeof v === 'string')]
		for (const t of code) {
			const beside = clean(declarationBeside(t))
			if (!beside.includes('*') && existsSync(join(dir, beside))) entries.add(beside)
		}
	}
	return [...entries].filter((e) => !e.includes('*'))
}

/** Blank out comments and string literals, keeping line breaks, so a scan sees only code. */
function codeOnly(text: string): string {
	let out = ''
	let i = 0
	while (i < text.length) {
		const c = text[i] as string
		const next = text[i + 1]
		let end: number
		if (c === '/' && next === '/') end = text.indexOf('\n', i) === -1 ? text.length : text.indexOf('\n', i)
		else if (c === '/' && next === '*')
			end = text.indexOf('*/', i + 2) === -1 ? text.length : text.indexOf('*/', i + 2) + 2
		else if (c === '"' || c === "'" || c === '`') {
			end = i + 1
			while (end < text.length && text[end] !== c) end += text[end] === '\\' ? 2 : 1
			end += 1
		} else {
			out += c
			i++
			continue
		}
		out += text.slice(i, end).replace(/[^\n]/g, ' ')
		i = end
	}
	return out
}

const DECLARATION =
	/^(export\s+)?(declare\s+)?(default\s+)?(abstract\s+)?(async\s+)?(function\*?|const|let|var|class|interface|type|enum|namespace|module)\s+([A-Za-z_$][\w$]*)/

/** Whether a `/** … *\/` block ends on the last non-blank line before `index`. */
function hasDocAbove(lines: string[], index: number): boolean {
	let i = index - 1
	while (i >= 0 && (lines[i] as string).trim() === '') i--
	if (i < 0 || !(lines[i] as string).trim().endsWith('*/')) return false
	while (i >= 0 && !(lines[i] as string).includes('/*')) i--
	return i >= 0 && (lines[i] as string).includes('/**')
}

function resolveRelative(fromFile: string, spec: string, dir: string): string | undefined {
	const base = join(dirname(join(dir, fromFile)), spec)
	const candidates = /\.[mc]?[jt]sx?$/.test(spec)
		? [declarationBeside(base)]
		: [`${base}.d.ts`, join(base, 'index.d.ts')]
	const found = candidates.find((c) => existsSync(c))
	return found === undefined ? undefined : relative(dir, found)
}

interface Declarations {
	files: string[]
	symbols: ExportedSymbol[]
	anyUsages: string[]
	deprecatedTags: number
	tokens: number
}

function readDeclarations(dir: string, entries: string[]): Declarations {
	const result: Declarations = { files: [], symbols: [], anyUsages: [], deprecatedTags: 0, tokens: 0 }
	const queue = entries.filter((e) => existsSync(join(dir, e)))
	const seen = new Set(queue)
	while (queue.length > 0) {
		const file = queue.shift() as string
		const text = read(join(dir, file)) ?? ''
		result.files.push(file)
		result.tokens += estimateTokens(text)
		result.deprecatedTags += text.match(/@deprecated\b/g)?.length ?? 0

		const lines = text.split('\n')
		const code = codeOnly(text).split('\n')
		const documented = new Map<string, boolean>()
		const exported = new Set<string>()
		code.forEach((line, i) => {
			if (/\bany\b/.test(line)) result.anyUsages.push(`${file}:${i + 1}`)
			const m = DECLARATION.exec(line.trim())
			if (m) {
				const name = m[7] as string
				// Overloads and merged declarations share a name; one doc comment covers them.
				documented.set(name, (documented.get(name) ?? false) || hasDocAbove(lines, i))
				if (m[1]) exported.add(name)
			}
		})
		// `export { a, b as c }` with no `from` exports declarations made earlier in the file, the shape bundled .d.ts files use.
		for (const m of codeOnly(text).matchAll(/export\s+(?:type\s+)?\{([^}]*)\}(?!\s*from)/g)) {
			for (const part of (m[1] as string).split(',')) {
				const local = part
					.trim()
					.split(/\s+as\s+/)[0]
					?.replace(/^type\s+/, '')
				if (local) exported.add(local)
			}
		}
		for (const name of exported) {
			if (documented.has(name)) result.symbols.push({ file, name, documented: documented.get(name) as boolean })
		}
		for (const m of text.matchAll(
			/export\s+(?:\*|(?:type\s+)?\{[^}]*\})(?:\s+as\s+\w+)?\s+from\s+['"](\.[^'"]+)['"]/g,
		)) {
			const target = resolveRelative(file, m[1] as string, dir)
			if (target && !seen.has(target)) {
				seen.add(target)
				queue.push(target)
			}
		}
	}
	return result
}

const VERSION_HEADING = /^##\s+\[?v?(\d+)\.(\d+)\.(\d+)/
const BREAKING_LABEL = /major changes|breaking/i

function readChangelog(dir: string): PackageFacts['changelog'] {
	const path = ['CHANGELOG.md', 'changelog.md', 'CHANGELOG'].find((f) => existsSync(join(dir, f)))
	if (!path) return undefined
	const sections: Array<{ version: string; major: number; body: string }> = []
	for (const line of (read(join(dir, path)) ?? '').split('\n')) {
		const m = VERSION_HEADING.exec(line)
		if (m) sections.push({ version: `${m[1]}.${m[2]}.${m[3]}`, major: Number(m[1]), body: '' })
		else if (sections.length > 0) (sections[sections.length - 1] as { body: string }).body += `${line}\n`
	}
	// Newest first: a section is a major release when its major is above the next (older) section's.
	const unlabelledMajors = sections
		.filter((s, i) => {
			const older = sections[i + 1]
			return older !== undefined && s.major > older.major && !BREAKING_LABEL.test(s.body)
		})
		.map((s) => s.version)
	return { path, versions: sections.length, unlabelledMajors }
}

function git(dir: string, args: string[]) {
	return spawnSync('git', args, { cwd: dir, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

function repoRoot(dir: string): string | undefined {
	const r = git(dir, ['rev-parse', '--show-toplevel'])
	return r.status === 0 ? r.stdout.trim() : undefined
}

function scriptsOf(dir: string): Record<string, unknown> {
	return readManifest(dir).scripts ?? {}
}

function readLlms(dir: string, root: string | undefined) {
	const llmsTxt = new Set<string>()
	for (const f of ['llms.txt', 'public/llms.txt', 'static/llms.txt']) if (existsSync(join(dir, f))) llmsTxt.add(f)
	if (root !== undefined) {
		const r = git(root, ['ls-files', '-z'])
		if (r.status === 0) {
			for (const f of r.stdout.split('\0')) {
				if (/(^|\/)llms(-full)?\.txt$/.test(f)) llmsTxt.add(relative(dir, join(root, f)))
			}
		}
	}

	const driftChecks: string[] = []
	const scriptSources = root !== undefined && root !== dir ? [dir, root] : [dir]
	for (const source of scriptSources) {
		for (const [name, command] of Object.entries(scriptsOf(source))) {
			const text = `${name} ${String(command)}`
			if (/llms/i.test(text) && /check/i.test(text))
				driftChecks.push(`${relative(dir, join(source, 'package.json'))}#${name}`)
		}
	}
	const workflows = root === undefined ? undefined : join(root, '.github/workflows')
	if (workflows && existsSync(workflows)) {
		for (const f of readdirSync(workflows)) {
			const text = read(join(workflows, f)) ?? ''
			if (/llms/i.test(text) && /check/i.test(text)) driftChecks.push(relative(dir, join(workflows, f)))
		}
	}
	return { llmsTxt: [...llmsTxt], llmsDriftChecks: driftChecks }
}

/** `SKILL.md` files within three levels of the package root, the depth of `skills/<name>/SKILL.md`. */
function findSkills(dir: string, rel = '', depth = 0): string[] {
	if (depth > 3) return []
	let entries: Dirent[]
	try {
		entries = readdirSync(join(dir, rel), { withFileTypes: true })
	} catch {
		return []
	}
	const found: string[] = []
	for (const entry of entries) {
		const path = rel ? `${rel}/${entry.name}` : entry.name
		if (entry.isFile() && entry.name === 'SKILL.md') found.push(path)
		else if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git') {
			found.push(...findSkills(dir, path, depth + 1))
		}
	}
	return found
}

function countReadmeExamples(dir: string): { hasReadme: boolean; examples: number } {
	const file = readdirSync(dir).find((f) => /^readme(\.[a-z]+)?$/i.test(f))
	if (!file) return { hasReadme: false, examples: 0 }
	const text = read(join(dir, file)) ?? ''
	return {
		hasReadme: true,
		examples: text.match(/^\s*(```|~~~)\s*(js|jsx|javascript|ts|tsx|typescript|mjs|cjs|mts|cts)\b/gim)?.length ?? 0,
	}
}

export function collectPackageFacts(dir: string): PackageFacts {
	const pkg = readManifest(dir)
	const { problems } = readExports(pkg)
	const hasExports = pkg.exports !== undefined
	const entryPoints = (['exports', 'main', 'module', 'bin'] as const).filter((f) => pkg[f] !== undefined)
	const declarationEntries = findDeclarationEntries(dir, pkg)
	const declarations = readDeclarations(dir, declarationEntries)
	const readme = countReadmeExamples(dir)
	const root = repoRoot(dir)

	return {
		name: typeof pkg.name === 'string' ? pkg.name : undefined,
		hasReadme: readme.hasReadme,
		readmeExamples: readme.examples,
		entryPoints,
		hasExports,
		exportsProblems: hasExports ? problems : [],
		declarationEntries,
		missingDeclarations: declarationEntries.filter((e) => !existsSync(join(dir, e))),
		declarationFiles: declarations.files,
		exportedSymbols: declarations.symbols,
		anyUsages: declarations.anyUsages,
		deprecatedTags: declarations.deprecatedTags,
		declarationTokens: declarations.tokens,
		changelog: readChangelog(dir),
		...readLlms(dir, root),
		shippedSkills: findSkills(dir),
	}
}
