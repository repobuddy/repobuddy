/**
 * Decide whether a Bash command that runs `gh api` or `glab api` is provably read-only.
 *
 * Both send GET by default, but switch to POST as soon as a field (`-f`, `-F`, and `glab`'s `--form`)
 * or a body (`--input`) is given, and `-X`/`--method` overrides both. The `graphql` endpoint is always POST, so
 * there the body decides: a query reads, a `mutation` writes.
 *
 * The decision is deliberately one-sided. `allow` is returned only when every word of the command is
 * visible in the text and the request is a GET (or a GraphQL query with no `mutation`). Anything the
 * guard cannot see through — a pipe, a command substitution, a variable, a file read with `@file` or
 * `--input`, a flag it does not know — is `ask`, never `allow`. Commands that do not start with
 * `gh api` or `glab api` get `defer`, which leaves them to the harness's own permission rules.
 */

type Decision = 'allow' | 'ask' | 'defer'

export interface Verdict {
	decision: Decision
	reason: string
}

interface Words {
	words: string[]
	/** Why the command cannot be read as one simple command, if it cannot. */
	unsafe?: string
}

/**
 * Split a command into shell words, the way a POSIX shell would for a simple command. Anything that
 * makes the words depend on runtime state (expansion, substitution) or chains another command marks
 * the result unsafe instead of being interpreted.
 */
export function splitWords(command: string): Words {
	const words: string[] = []
	let word = ''
	let inWord = false
	let quote: "'" | '"' | undefined
	const unsafe = (why: string): Words => ({ words, unsafe: why })

	for (let i = 0; i < command.length; i++) {
		const c = command[i] as string
		if (quote === "'") {
			if (c === "'") quote = undefined
			else word += c
			continue
		}
		if (quote === '"') {
			if (c === '"') quote = undefined
			else if (c === '$' || c === '`') return unsafe('it expands a variable or runs a command substitution')
			else if (c === '\\' && i + 1 < command.length && '"\\$`'.includes(command[i + 1] as string)) word += command[++i]
			else word += c
			continue
		}
		if (c === "'" || c === '"') {
			quote = c
			inWord = true
		} else if (c === '\\') {
			if (i + 1 < command.length) word += command[++i]
			inWord = true
		} else if (c === ' ' || c === '\t') {
			if (inWord) words.push(word)
			word = ''
			inWord = false
		} else if (c === '\n' || ';&|<>()'.includes(c)) {
			return unsafe('it chains, pipes, or redirects to another command')
		} else if (c === '$' || c === '`') {
			return unsafe('it expands a variable or runs a command substitution')
		} else if (c === '{' && /^[^\s'"]*,/.test(command.slice(i + 1).split('}')[0] ?? '')) {
			return unsafe('it uses brace expansion')
		} else {
			word += c
			inWord = true
		}
	}
	if (quote) return unsafe('it has an unterminated quote')
	if (inWord) words.push(word)
	return { words }
}

/** How one CLI's `api` command reads its arguments. */
interface ApiCli {
	/** The host the request goes to, for reasons shown to the user. */
	host: string
	/** Short flags that take a value, mapped to their long name. */
	valueFlags: Record<string, string>
	/** Long flags that take a value, beyond the long names of `valueFlags`. */
	longValueFlags: string[]
	boolShort: string[]
	longBoolFlags: string[]
	/** Long names of the flags that add a field and so switch the default method to POST. */
	fieldFlags: string[]
	/** Long names of the field flags whose `@file` value reads a file or stdin. */
	fileFields: string[]
}

const CLIS: Record<string, ApiCli> = {
	gh: {
		host: 'GitHub',
		valueFlags: { X: 'method', F: 'field', f: 'raw-field', H: 'header', q: 'jq', t: 'template', p: 'preview' },
		longValueFlags: ['hostname', 'input', 'cache'],
		boolShort: ['i'],
		longBoolFlags: ['include', 'paginate', 'silent', 'slurp', 'verbose'],
		fieldFlags: ['field', 'raw-field'],
		fileFields: ['field'],
	},
	// glab documents `@file` for its fields without saying `-f` is exempt, so every field flag counts.
	glab: {
		host: 'GitLab',
		valueFlags: { X: 'method', F: 'field', f: 'raw-field', H: 'header' },
		longValueFlags: ['hostname', 'input', 'output', 'form'],
		boolShort: ['i'],
		longBoolFlags: ['include', 'paginate', 'silent'],
		fieldFlags: ['field', 'raw-field', 'form'],
		fileFields: ['field', 'raw-field', 'form'],
	},
}

interface Parsed {
	endpoint?: string
	method?: string
	fields: { flag: string; value: string }[]
	headers: string[]
	input: boolean
	extraPositional: boolean
	unknown?: string
}

function parseApiArgs(cli: ApiCli, args: string[]): Parsed {
	const parsed: Parsed = { fields: [], headers: [], input: false, extraPositional: false }
	const longValueFlags = new Set([...Object.values(cli.valueFlags), ...cli.longValueFlags])
	const take = (name: string, value: string) => {
		if (name === 'method') parsed.method = value.toUpperCase()
		else if (cli.fieldFlags.includes(name)) parsed.fields.push({ flag: name, value })
		else if (name === 'header') parsed.headers.push(value)
		else if (name === 'input') parsed.input = true
	}
	const positional = (value: string) => {
		if (parsed.endpoint === undefined) parsed.endpoint = value
		else parsed.extraPositional = true
	}

	for (let i = 0; i < args.length; i++) {
		const a = args[i] as string
		if (a === '--') {
			for (const rest of args.slice(i + 1)) positional(rest)
			break
		}
		if (a.startsWith('--')) {
			const eq = a.indexOf('=')
			const name = eq < 0 ? a.slice(2) : a.slice(2, eq)
			if (cli.longBoolFlags.includes(name) && eq < 0) continue
			if (!longValueFlags.has(name)) return { ...parsed, unknown: a }
			const value = eq < 0 ? args[++i] : a.slice(eq + 1)
			if (value === undefined) return { ...parsed, unknown: a }
			take(name, value)
			continue
		}
		if (a.startsWith('-') && a.length > 1) {
			// A cluster of short flags: `-i`, `-XPOST`, `-X=POST`, `-iX POST`.
			for (let j = 1; j < a.length; j++) {
				const letter = a[j] as string
				if (cli.boolShort.includes(letter)) continue
				const name = cli.valueFlags[letter]
				if (!name) return { ...parsed, unknown: a }
				let value = a.slice(j + 1)
				if (value.startsWith('=')) value = value.slice(1)
				if (value === '' && j === a.length - 1) {
					const next = args[++i]
					if (next === undefined) return { ...parsed, unknown: a }
					value = next
				}
				take(name, value)
				break
			}
			continue
		}
		positional(a)
	}
	return parsed
}

/** Decide one Bash command. */
export function decide(command: string): Verdict {
	const trimmed = command.trim()
	// Cheap pre-check so unrelated commands never reach the parser.
	const name = /^(?:\S*\/)?(gh|glab)\s+api(?:\s|$)/.exec(trimmed)?.[1]
	if (!name) return { decision: 'defer', reason: 'not a gh api or glab api command' }
	const cli = CLIS[name] as ApiCli
	const ask = (reason: string): Verdict => ({ decision: 'ask', reason: `${name} api guard: ${reason}` })
	const allow = (reason: string): Verdict => ({ decision: 'allow', reason: `${name} api guard: ${reason}` })

	const { words, unsafe } = splitWords(trimmed)
	if (unsafe) return ask(`cannot confirm this is read-only: ${unsafe}`)
	const [, , ...args] = words
	const p = parseApiArgs(cli, args)
	if (p.unknown) return ask(`unrecognized flag ${p.unknown}`)
	if (p.endpoint === undefined) return ask('no endpoint given')
	if (p.extraPositional) return ask('more than one endpoint argument')
	if (p.endpoint.includes('://')) return ask('the endpoint is a full URL, which may point outside the configured host')
	if (p.input) return ask('--input sends a request body read from a file or stdin')
	if (
		p.fields.some((f) => cli.fileFields.includes(f.flag) && f.value.slice(f.value.indexOf('=') + 1).startsWith('@'))
	) {
		return ask(`a field reads a file or stdin (@...), which would send its contents to ${cli.host}`)
	}
	if (p.headers.some((h) => /method/i.test(h.split(':')[0] ?? ''))) return ask('a header overrides the HTTP method')

	const isGraphql = p.endpoint.replace(/^\/+|\/+$/g, '') === 'graphql'
	if (isGraphql) {
		if (p.method !== undefined && p.method !== 'POST') return ask(`graphql with -X ${p.method}`)
		if (p.fields.some((f) => /\b(mutation|subscription)\b/i.test(f.value))) {
			return ask('the GraphQL body contains a mutation')
		}
		if (p.fields.length === 0) return ask('graphql with no query')
		return allow('GraphQL query with no mutation')
	}

	const method = p.method ?? (p.fields.length > 0 ? 'POST' : 'GET')
	if (method !== 'GET') {
		const why = p.method ? `-X ${method}` : `fields switch ${name} api to POST`
		return ask(`${why}; only GET is allowed without asking`)
	}
	return allow('read-only GET request')
}
