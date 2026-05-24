#!/usr/bin/env node
import { findAwesomeSkills } from './awesome-lib.mts'

function parseArgs(argv: string[]): { query: string; limit: number; json: boolean } {
	const args = argv.slice(2)
	const json = args.includes('--json')
	const limitIdx = args.indexOf('--limit')
	const limit = limitIdx !== -1 ? Number(args[limitIdx + 1]) : 8
	const query = args
		.filter((arg, index) => arg !== '--json' && index !== limitIdx && index !== limitIdx + 1)
		.join(' ')
		.trim()
	return { query, limit: Number.isFinite(limit) && limit > 0 ? limit : 8, json }
}

const { query, limit, json } = parseArgs(process.argv)
const results = (await findAwesomeSkills(process.cwd(), query)).slice(0, limit)

if (json) {
	console.log(JSON.stringify(results, null, 2))
	process.exit(0)
}

if (results.length === 0) {
	console.log(query ? `No awesome skill matches for "${query}".` : 'No awesome skill entries found.')
	process.exit(0)
}

console.log(query ? `Awesome skill matches for "${query}":` : 'Awesome skill recommendations:')
for (const result of results) {
	const title = result.type === 'repo' ? result.repo : `${result.repo}#${result.skill}`
	console.log(`\n- ${title} (${result.kind}, ${result.trust})`)
	console.log(`  ${result.summary}`)
	console.log(`  Why recommended: ${result.why_recommended}`)
	if (result.reasons.length > 0) console.log(`  Match: ${result.reasons.join('; ')}`)
	if (result.corroborationCount > 1)
		console.log(`  Also recommended by ${result.corroborationCount - 1} other source(s).`)
	console.log(`  Install: ${result.installCommand}`)
}
