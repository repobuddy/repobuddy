import { copyFile } from 'node:fs/promises'
import { join } from 'node:path'
import { CliError, type cli, command, result, t } from 'clibuilder'
import { dirname } from 'dirname-filename-esm'

export const copyCJSPackageJson: cli.Command<any, any, any, any> = command({
	name: 'copy-cjs-package-json',
	description: 'Copy the package.json needed for CommonJS build.',
	alias: ['cpj'],
	arguments: [
		{
			name: 'dir',
			description: 'where to copy the file to. This should be the `outDir` of the CommonJS build',
			type: t.string(),
		},
		{
			name: 'cwd',
			description: 'project directory. Defaults to `process.cwd()`',
			type: t.string().optional(),
		},
	],
	examples: [
		{ command: 'buddy ts copy-cjs-package-json cjs', description: 'Copy it into ./cjs' },
		{ command: 'buddy ts cpj cjs packages/foo', description: 'Copy it into packages/foo/cjs' },
	],
	async run({ dir, cwd = process.cwd() }) {
		const target = join(cwd, `./${dir}/package.json`)
		try {
			await copyFile(join(dirname(import.meta), '../nodejs/package.cjs.json'), target)
		} catch (error: any) {
			throw new CliError(`cannot write ${dir}/package.json`, {
				code: 'copy-failed',
				details: { dir, cwd, reason: String(error?.code ?? error?.message ?? error) },
				help: `Create the \`${dir}\` directory, or pass the \`outDir\` of the CommonJS build`,
				cause: error,
			})
		}
		return result({ copied: target })
	},
})
