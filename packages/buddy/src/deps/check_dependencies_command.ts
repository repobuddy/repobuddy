import { CliError, command, exitCodes, z } from 'clibuilder'
import { checkDependencies } from './check_dependencies.js'
import { formatDependencyReport } from './format_dependency_report.js'

/**
 * `repobuddy check-deps` — report packages the project's jest configuration
 * uses that its `package.json` does not declare.
 *
 * This is a command the user runs, not an install hook. The same check as a
 * `postinstall` script would run in every consumer's install, on a machine that
 * did not ask for it, which is both intrusive and exactly the shape a
 * supply-chain review flags. Run deliberately — from a script, or from CI — it
 * gives the same answer at a moment when the answer is wanted, and its exit
 * code can gate a build.
 */
export const checkDependenciesCommand = command({
	name: 'check-deps',
	alias: ['check-dependencies'],
	description: 'Report packages the jest config uses that package.json does not declare',
	options: {
		cwd: {
			description: 'The project to check. Defaults to the current directory.',
			type: z.optional(z.string()),
		},
	},
	async run(args) {
		const cwd = args.cwd ?? this.cwd
		const report = await checkDependencies(cwd).catch((cause) => {
			throw new CliError(`cannot read the project at ${cwd}`, {
				help: 'check-deps needs a directory with a package.json',
				cause,
			})
		})

		for (const warning of report.warnings) this.ui.warn(warning)

		const [summary, ...details] = formatDependencyReport(report)
		if (report.missing.length === 0) {
			this.ui.info(summary)
			return report
		}

		throw new CliError(summary as string, { help: details, exitCode: exitCodes.error })
	},
})
