import { copyFile } from 'node:fs/promises'
import { join } from 'node:path'
import { type cli, command, t } from 'clibuilder'
import { dirname } from 'dirname-filename-esm'
import { execa } from 'execa'

export const build: cli.Command<any, any, any, any> = command({
	name: 'build',
	arguments: [
		{
			name: 'type',
			description: 'type of build: cjs, esm, or tslib',
			type: t.enum(['cjs', 'tslib', 'esm']),
		},
	],
	async run({ type }) {
		this.ui.info(`building ${type}...`)
		await execa('tsc', ['-p', `tsconfig.${type}.json`])
		if (type !== 'esm') {
			this.ui.info('copying package.json...')
			await copyFile(
				join(dirname(import.meta), '../nodejs/package.cjs.json'),
				join(process.cwd(), `./${type}/package.json`),
			)
		}
		this.ui.info(`build ${type} done`)
	},
})
