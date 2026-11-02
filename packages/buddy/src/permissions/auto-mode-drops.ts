/**
 * The allow rules Claude Code drops while auto mode is active, as observed with Claude Code 2.1.316:
 * a session started with `--permission-mode auto` logs "Ignoring dangerous permission <rule> ...
 * (bypasses classifier)" for each one, from any settings file. A shell rule is dropped when its
 * pattern, minus a trailing wildcard (`*`, ` *`, or `:*`), is exactly one of the prefixes below. A
 * narrower rule stays: `Bash(pnpm test *)`, `Bash(npm run test *)`, `Bash(pnpm *)`, `Bash(pnpm exec *)`.
 *
 * Shared by `review-permissions`' scanner, which reports these rules, and the `init-buddy` tests,
 * which keep its candidates out of the list.
 */
const DROPPED: [string, string[]][] = [
	['a package-manager run command', ['npm run', 'pnpm run', 'yarn run', 'bun run', 'npx', 'bunx']],
	['an interpreter', ['python', 'python3', 'node', 'ruby', 'perl', 'php', 'deno', 'tsx', 'bash', 'sh', 'zsh']],
	['an inline-code interpreter', ['python -c', 'node -e', 'ruby -e', 'perl -e', 'bash -c', 'sh -c', 'zsh -c']],
	['a command that runs another command', ['eval', 'exec', 'env', 'xargs', 'sudo']],
]

/** What kind of dropped rule this is, or null when the rule stays in effect in auto mode. */
export function droppedInAutoMode(tool: string, arg: string): string | null {
	if (tool === 'Agent' || tool === 'Monitor') return `\`${tool}\` allow rules`
	if (tool !== 'Bash' && tool !== 'PowerShell') return null
	const prefix = arg
		.trim()
		.replace(/(:\*|\*+)$/, '')
		.trim()
		.replace(/\s+/g, ' ')
	if (prefix === '') return `blanket \`${tool}(*)\``
	if (tool !== 'Bash') return null
	return DROPPED.find(([, prefixes]) => prefixes.includes(prefix))?.[0] ?? null
}
