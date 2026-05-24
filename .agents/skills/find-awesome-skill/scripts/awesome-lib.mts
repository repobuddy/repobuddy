import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

type EntryType = 'repo' | 'skill'
type RepoKind = 'targeted' | 'broad-catalog'
type TrustLevel = 'authored' | 'recommended'
type HighlightType = 'skill' | 'bundle' | 'workflow' | 'plugin' | 'mcp-server' | 'cli' | 'app' | 'doc'
type SourceClass = 'local-private' | 'repo-shared' | 'global-user' | 'default'

interface Highlight {
	type: HighlightType
	key: string
	summary: string
	why_recommended: string
	tags: string[]
}

interface RepoEntry {
	type: 'repo'
	repo: string
	kind: RepoKind
	trust: TrustLevel
	summary: string
	why_recommended: string
	tags: string[]
	highlights?: Highlight[]
}

interface SkillEntry {
	type: 'skill'
	repo: string
	skill: string
	kind: RepoKind
	trust: TrustLevel
	summary: string
	why_recommended: string
	tags: string[]
}

type AwesomeEntry = RepoEntry | SkillEntry

interface AwesomeListFile {
	version: 1
	repos: Record<string, Omit<RepoEntry, 'type'>>
	skills: Record<string, Omit<SkillEntry, 'type'>>
}

interface SourceRef {
	repo: string
	path: string
}

interface SourceConfigFile {
	version: 1
	sources?: SourceRef[]
	disabled_sources?: SourceRef[]
}

interface ResolvedSource extends SourceRef {
	sourceClass: SourceClass
	origin: string
}

interface AggregatedNote {
	source: string
	sourceClass: SourceClass
	why_recommended: string
}

interface AggregatedEntry {
	id: string
	type: EntryType
	repo: string
	skill?: string
	kind: RepoKind
	trust: TrustLevel
	summary: string
	why_recommended: string
	notes: AggregatedNote[]
	tags: string[]
	highlights?: Highlight[]
	corroborationCount: number
	sourceClasses: SourceClass[]
	installCommand: string
}

export interface SearchResult extends AggregatedEntry {
	score: number
	reasons: string[]
}

interface RemoteContentResponse {
	content?: string
	encoding?: string
}

const SOURCE_CLASS_RANK: Record<SourceClass, number> = {
	default: 0,
	'global-user': 1,
	'repo-shared': 2,
	'local-private': 3,
}

function normalizeRepo(repo: string): string {
	return repo
		.trim()
		.replace(/^https?:\/\/github\.com\//, '')
		.replace(/\.git$/, '')
		.replace(/^\/+|\/+$/g, '')
}

function normalizePath(filePath: string): string {
	return filePath.trim().replace(/^\/+/, '') || 'awesome-skills.json'
}

function normalizeTag(tag: string): string {
	return tag
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
}

function normalizeTags(value: unknown): string[] {
	if (!Array.isArray(value)) return []
	return Array.from(new Set(value.map((item) => normalizeTag(String(item))).filter(Boolean))).sort()
}

function entryId(entry: AwesomeEntry): string {
	return entry.type === 'repo' ? entry.repo : `${entry.repo}::${entry.skill}`
}

function skillEntryId(repo: string, skill: string): string {
	return `${repo}::${skill}`
}

function highlightId(repo: string, highlight: Highlight): string {
	return `${repo}::${highlight.type}::${highlight.key}`
}

function sourceKey(source: SourceRef): string {
	return `${normalizeRepo(source.repo)}::${normalizePath(source.path)}`
}

function deriveInstallCommand(entry: AwesomeEntry): string {
	return entry.type === 'repo' ? `npx skills add ${entry.repo}` : `npx skills add ${entry.repo} --skill ${entry.skill}`
}

function getLayerFilePath(cwd: string, sourceClass: Exclude<SourceClass, 'default'>): string {
	switch (sourceClass) {
		case 'local-private':
			return path.join(cwd, '.agents', 'awesome-skill-sources.local.json')
		case 'repo-shared':
			return path.join(cwd, '.agents', 'awesome-skill-sources.json')
		case 'global-user':
			return path.join(os.homedir(), '.agents', 'awesome-skill-sources.json')
	}
}

function parseRepositoryFromPackage(cwd: string): string | null {
	const manifestPath = path.join(cwd, 'package.json')
	if (!fs.existsSync(manifestPath)) return null
	const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { repository?: { url?: string } | string }
	const repoUrl = typeof manifest.repository === 'string' ? manifest.repository : manifest.repository?.url
	if (!repoUrl) return null
	const match = repoUrl.match(/github\.com[:/](.+?)(?:\.git)?$/)
	return match ? normalizeRepo(match[1]) : null
}

function validateHighlight(value: unknown, context: string): Highlight {
	const highlight = value as Partial<Highlight>
	if (!highlight || typeof highlight !== 'object') throw new Error(`${context} must be an object`)
	if (!highlight.type || !highlight.key || !highlight.summary || !highlight.why_recommended) {
		throw new Error(`${context} must include type, key, summary, and why_recommended`)
	}
	return {
		type: highlight.type,
		key: String(highlight.key),
		summary: String(highlight.summary),
		why_recommended: String(highlight.why_recommended),
		tags: normalizeTags(highlight.tags),
	}
}

export function validateAwesomeList(data: unknown, origin: string): AwesomeListFile {
	const file = data as Partial<AwesomeListFile>
	if (
		!file ||
		typeof file !== 'object' ||
		file.version !== 1 ||
		typeof file.repos !== 'object' ||
		file.repos === null ||
		typeof file.skills !== 'object' ||
		file.skills === null
	) {
		throw new Error(`${origin} must contain version: 1 plus repos and skills objects`)
	}

	const repos = Object.fromEntries(
		Object.entries(file.repos).map(([key, raw], index) => {
			const entry = raw as Partial<Omit<RepoEntry, 'type'>>
			const context = `${origin} repo ${index + 1}`
			if (!entry || typeof entry !== 'object') throw new Error(`${context} must be an object`)
			if (!entry.repo || !entry.summary || !entry.why_recommended || !entry.kind || !entry.trust) {
				throw new Error(`${context} is missing required fields`)
			}
			const normalizedRepo = normalizeRepo(entry.repo)
			if (key !== normalizedRepo) throw new Error(`${context} key must match normalized repo ${normalizedRepo}`)
			return [
				key,
				{
					repo: normalizedRepo,
					kind: entry.kind,
					trust: entry.trust,
					summary: String(entry.summary),
					why_recommended: String(entry.why_recommended),
					tags: normalizeTags(entry.tags),
					highlights: Array.isArray(entry.highlights)
						? entry.highlights.map((item, i) => validateHighlight(item, `${context} highlight ${i + 1}`))
						: [],
				} satisfies Omit<RepoEntry, 'type'>,
			]
		}),
	)

	const skills = Object.fromEntries(
		Object.entries(file.skills).map(([key, raw], index) => {
			const entry = raw as Partial<Omit<SkillEntry, 'type'>>
			const context = `${origin} skill ${index + 1}`
			if (!entry || typeof entry !== 'object') throw new Error(`${context} must be an object`)
			if (!entry.repo || !entry.skill || !entry.summary || !entry.why_recommended || !entry.kind || !entry.trust) {
				throw new Error(`${context} is missing required fields`)
			}
			const normalizedRepo = normalizeRepo(entry.repo)
			const normalizedSkill = String(entry.skill)
			const normalizedId = skillEntryId(normalizedRepo, normalizedSkill)
			if (key !== normalizedId) throw new Error(`${context} key must match normalized skill id ${normalizedId}`)
			return [
				key,
				{
					repo: normalizedRepo,
					skill: normalizedSkill,
					kind: entry.kind,
					trust: entry.trust,
					summary: String(entry.summary),
					why_recommended: String(entry.why_recommended),
					tags: normalizeTags(entry.tags),
				} satisfies Omit<SkillEntry, 'type'>,
			]
		}),
	)

	return { version: 1, repos, skills }
}

export function flattenAwesomeEntries(file: AwesomeListFile): AwesomeEntry[] {
	const repoEntries = Object.values(file.repos).map((entry) => ({
		type: 'repo' as const,
		...entry,
	}))
	const skillEntries = Object.values(file.skills).map((entry) => ({
		type: 'skill' as const,
		...entry,
	}))
	return [...repoEntries, ...skillEntries]
}

function loadSourceConfigFile(filePath: string): SourceConfigFile {
	if (!fs.existsSync(filePath)) return { version: 1, sources: [], disabled_sources: [] }
	return JSON.parse(fs.readFileSync(filePath, 'utf8')) as SourceConfigFile
}

function getResolvedSources(cwd: string): ResolvedSource[] {
	const layers: Array<{ sourceClass: Exclude<SourceClass, 'default'>; path: string }> = [
		{ sourceClass: 'local-private', path: getLayerFilePath(cwd, 'local-private') },
		{ sourceClass: 'repo-shared', path: getLayerFilePath(cwd, 'repo-shared') },
		{ sourceClass: 'global-user', path: getLayerFilePath(cwd, 'global-user') },
	]
	const disabled = new Set<string>()
	const kept = new Map<string, ResolvedSource>()

	for (const layer of layers) {
		const config = loadSourceConfigFile(layer.path)
		for (const ref of config.disabled_sources ?? []) disabled.add(sourceKey(ref))
	}

	const currentRepo = parseRepositoryFromPackage(cwd)
	if (currentRepo) {
		const ref = { repo: currentRepo, path: 'awesome-skills.json' }
		const key = sourceKey(ref)
		if (!disabled.has(key) && fs.existsSync(path.join(cwd, ref.path))) {
			kept.set(key, { ...ref, sourceClass: 'default', origin: path.join(cwd, ref.path) })
		}
	}

	for (const layer of layers.slice().reverse()) {
		const config = loadSourceConfigFile(layer.path)
		for (const ref of config.sources ?? []) {
			const key = sourceKey(ref)
			if (disabled.has(key)) continue
			const existing = kept.get(key)
			if (!existing || SOURCE_CLASS_RANK[layer.sourceClass] > SOURCE_CLASS_RANK[existing.sourceClass]) {
				kept.set(key, { ...ref, sourceClass: layer.sourceClass, origin: layer.path })
			}
		}
	}

	return Array.from(kept.values()).sort((a, b) => SOURCE_CLASS_RANK[b.sourceClass] - SOURCE_CLASS_RANK[a.sourceClass])
}

async function loadAwesomeListFromSource(source: ResolvedSource, cwd: string): Promise<AwesomeListFile> {
	const currentRepo = parseRepositoryFromPackage(cwd)
	if (currentRepo && source.repo === currentRepo) {
		return validateAwesomeList(JSON.parse(fs.readFileSync(path.join(cwd, source.path), 'utf8')), source.path)
	}

	const response = await fetch(`https://api.github.com/repos/${source.repo}/contents/${source.path}`, {
		headers: {
			Accept: 'application/vnd.github+json',
			'User-Agent': 'cyber-skills-awesome-skills',
		},
	})
	if (!response.ok)
		throw new Error(`Failed to fetch ${source.repo}/${source.path}: ${response.status} ${response.statusText}`)
	const body = (await response.json()) as RemoteContentResponse
	if (!body.content || body.encoding !== 'base64') {
		throw new Error(`GitHub contents API did not return base64 content for ${source.repo}/${source.path}`)
	}
	return validateAwesomeList(
		JSON.parse(Buffer.from(body.content, 'base64').toString('utf8')),
		`${source.repo}/${source.path}`,
	)
}

async function loadAllAwesomeLists(cwd: string): Promise<Array<{ source: ResolvedSource; file: AwesomeListFile }>> {
	const loaded: Array<{ source: ResolvedSource; file: AwesomeListFile }> = []
	for (const source of getResolvedSources(cwd)) {
		loaded.push({ source, file: await loadAwesomeListFromSource(source, cwd) })
	}
	return loaded
}

function mergeAwesomeEntries(loaded: Array<{ source: ResolvedSource; file: AwesomeListFile }>): AggregatedEntry[] {
	const byId = new Map<
		string,
		{
			canonical: AwesomeEntry
			canonicalSourceClass: SourceClass
			tags: Set<string>
			notes: AggregatedNote[]
			highlights: Map<string, Highlight>
			sourceClasses: Set<SourceClass>
		}
	>()

	for (const { source, file } of loaded) {
		for (const entry of flattenAwesomeEntries(file)) {
			const id = entryId(entry)
			const note = {
				source: `${source.repo}/${source.path}`,
				sourceClass: source.sourceClass,
				why_recommended: entry.why_recommended,
			}
			const existing = byId.get(id)
			if (!existing) {
				byId.set(id, {
					canonical: entry,
					canonicalSourceClass: source.sourceClass,
					tags: new Set(entry.tags),
					notes: [note],
					highlights: new Map(
						(entry.type === 'repo' ? (entry.highlights ?? []) : []).map((item) => [
							highlightId(entry.repo, item),
							item,
						]),
					),
					sourceClasses: new Set([source.sourceClass]),
				})
				continue
			}
			existing.sourceClasses.add(source.sourceClass)
			for (const tag of entry.tags) existing.tags.add(tag)
			if (
				!existing.notes.some((item) => item.source === note.source && item.why_recommended === note.why_recommended)
			) {
				existing.notes.push(note)
			}
			if (entry.type === 'repo') {
				for (const highlight of entry.highlights ?? []) {
					const key = highlightId(entry.repo, highlight)
					if (!existing.highlights.has(key)) existing.highlights.set(key, highlight)
				}
			}
			if (SOURCE_CLASS_RANK[source.sourceClass] > SOURCE_CLASS_RANK[existing.canonicalSourceClass]) {
				existing.canonical = entry
				existing.canonicalSourceClass = source.sourceClass
			}
		}
	}

	return Array.from(byId.entries()).map(([id, state]) => ({
		id,
		type: state.canonical.type,
		repo: state.canonical.repo,
		skill: state.canonical.type === 'skill' ? state.canonical.skill : undefined,
		kind: state.canonical.kind,
		trust: state.canonical.trust,
		summary: state.canonical.summary,
		why_recommended: state.notes[0]?.why_recommended ?? state.canonical.why_recommended,
		notes: state.notes,
		tags: Array.from(state.tags).sort(),
		highlights:
			state.canonical.type === 'repo'
				? Array.from(state.highlights.values()).sort((a, b) => a.key.localeCompare(b.key))
				: undefined,
		corroborationCount: state.notes.length,
		sourceClasses: Array.from(state.sourceClasses).sort((a, b) => SOURCE_CLASS_RANK[b] - SOURCE_CLASS_RANK[a]),
		installCommand: deriveInstallCommand(state.canonical),
	}))
}

function tokenize(value: string): string[] {
	return value
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter(Boolean)
}

export async function findAwesomeSkills(cwd: string, query: string): Promise<SearchResult[]> {
	const loaded = await loadAllAwesomeLists(cwd)
	const entries = mergeAwesomeEntries(loaded)
	const q = query.trim().toLowerCase()
	const tokens = tokenize(q)

	return entries
		.map((entry) => {
			let score = 0
			const reasons: string[] = []
			const repoText = entry.repo.toLowerCase()
			const skillText = entry.skill?.toLowerCase() ?? ''
			const summaryText = entry.summary.toLowerCase()
			const highlightText = (entry.highlights ?? [])
				.map((item) => `${item.type} ${item.key} ${item.summary} ${item.tags.join(' ')}`)
				.join(' ')
				.toLowerCase()

			if (!q) {
				score += entry.trust === 'authored' ? 10 : 0
				score += entry.corroborationCount
			}
			if (q && (repoText === q || skillText === q)) {
				score += 100
				reasons.push('exact name match')
			}
			if (q && (repoText.includes(q) || skillText.includes(q) || highlightText.includes(q))) {
				score += 50
				reasons.push('name contains query')
			}
			for (const token of tokens) {
				if (summaryText.includes(token)) score += 10
				if (entry.tags.some((tag) => tag.includes(token))) score += 12
				if (highlightText.includes(token)) score += 8
			}
			const corroborationBonus = Math.max(0, entry.corroborationCount - 1) * 6
			score += corroborationBonus
			if (corroborationBonus > 0) reasons.push(`recommended by ${entry.corroborationCount} sources`)
			if (entry.sourceClasses.includes('local-private')) score += 6
			else if (entry.sourceClasses.includes('repo-shared')) score += 4
			else if (entry.sourceClasses.includes('global-user')) score += 2
			if (score > 0 && tokens.some((token) => entry.tags.includes(token))) reasons.push('tag match')
			return { ...entry, score, reasons: Array.from(new Set(reasons)) }
		})
		.filter((entry) => entry.score > 0 || !q)
		.sort((a, b) => b.score - a.score || a.repo.localeCompare(b.repo) || (a.skill ?? '').localeCompare(b.skill ?? ''))
}
