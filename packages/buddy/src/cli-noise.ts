const NO_CONFIG_FOUND = 'no config found under'

/**
 * clibuilder's `config: true` (see app.ts) eagerly resolves the repobuddy config and warns
 * "no config found under '<cwd>': ..." whenever the cwd has none. That fires on every
 * invocation — including `--version` and `--help` — in any directory that has not opted into a
 * repobuddy config, which is the normal, supported state (see
 * .agents/spec/configuration/configuration.feature: "a repository with no configuration still
 * runs").
 *
 * clibuilder binds `console.warn` once — the first time it builds its console reporter, which
 * happens as a side effect of the `cli(...)` call in app.ts — and keeps calling that bound
 * reference afterward. So this must run *before* that call, or the bound reference already
 * points at the unfiltered original and a later reassignment of `console.warn` has no effect.
 * app.ts calls this before its own `cli(...)` call for exactly that reason.
 *
 * Any other warning — a broken plugin, for instance — still prints normally.
 */
export function installMissingConfigWarningFilter(): void {
	const original = console.warn
	console.warn = (...args: unknown[]) => {
		if (args.some((a) => typeof a === 'string' && a.includes(NO_CONFIG_FOUND))) return
		original(...args)
	}
}
