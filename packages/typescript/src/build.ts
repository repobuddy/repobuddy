import { copyFile } from 'node:fs/promises'
import { join } from 'node:path'
import { CliError, type cli, command, result, t } from 'clibuilder'
import { dirname } from 'dirname-filename-esm'
import { execa } from 'execa'

export const build: cli.Command<any, any, any, any> = command({
	name: 'build',
	description: 'Run `tsc` with tsconfig.<type>.json, and mark cjs and tslib output as CommonJS.',
	arguments: [
		{
			name: 'type',
			description: 'type of build: cjs, esm, or tslib',
			type: t.enum(['cjs', 'tslib', 'esm']),
		},
	],
	examples: [
		{ command: 'buddy ts build esm', description: 'Compile with tsconfig.esm.json' },
		{ command: 'buddy ts build cjs', description: 'Compile with tsconfig.cjs.json and add the CommonJS package.json' },
	],
	async run({ type }) {
		const tsconfig = `tsconfig.${type}.json`
		try {
			await execa('tsc', ['-p', tsconfig])
		} catch (error: any) {
			throw new CliError(`tsc failed for ${tsconfig}`, {
				code: 'tsc-failed',
				details: { tsconfig, output: String(error?.shortMessage ?? error?.message ?? error) },
				help: `Run \`tsc -p ${tsconfig}\` to see the full diagnostics`,
				cause: error,
			})
		}
		if (type === 'esm') return result({ type, tsconfig, packageJson: 'not needed for esm' })

		const target = join(process.cwd(), `./${type}/package.json`)
		try {
			await copyFile(join(dirname(import.meta), '../nodejs/package.cjs.json'), target)
		} catch (error: any) {
			throw new CliError(`cannot write ${type}/package.json`, {
				code: 'copy-failed',
				details: { dir: type, reason: String(error?.code ?? error?.message ?? error) },
				help: `Check that tsconfig.${type}.json sets \`outDir\` to \`${type}\``,
				cause: error,
			})
		}
		return result({ type, tsconfig, packageJson: `${type}/package.json` })
	},
})
