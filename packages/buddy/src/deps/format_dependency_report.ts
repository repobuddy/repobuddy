import type { CheckDependenciesResult } from './check_dependencies.js'

/**
 * The install command to suggest, chosen from the `packageManager` field the
 * project declares. npm is the fallback, because every project has it.
 */
export function installCommand(packages: string[], packageManager?: string): string {
	const agent = packageManager?.split('@')[0]
	const command =
		agent === 'pnpm' ? 'pnpm add -D' : agent === 'yarn' ? 'yarn add -D' : agent === 'bun' ? 'bun add -d' : 'npm i -D'
	return `${command} ${packages.join(' ')}`
}

/**
 * Turn a report into the lines to print, the first one summarizing the rest.
 *
 * Every outcome says what it found, including the two that found nothing: an
 * ambiguous silence just makes the reader run the command again with different
 * flags. Warnings are left to the caller, which has somewhere better to put
 * them than the middle of the result.
 */
export function formatDependencyReport(report: CheckDependenciesResult): string[] {
	if (!report.from) return ['dependencies: no jest configuration found, nothing to check']

	if (report.missing.length === 0) {
		return [`dependencies: ${report.required.length} used by ${report.from}, all declared in package.json`]
	}

	const width = Math.max(...report.missing.map((dep) => dep.name.length))
	return [
		`missing dependencies: ${report.missing.length} used by ${report.from} but not declared in package.json`,
		...report.missing.map((dep) => `  ${dep.name.padEnd(width)}  ${dep.sources.join(', ')}`),
		`install: ${installCommand(
			report.missing.map((dep) => dep.name),
			report.packageManager,
		)}`,
	]
}
