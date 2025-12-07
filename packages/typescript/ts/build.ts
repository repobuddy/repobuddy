import { copyFile } from 'node:fs/promises'
import { join } from 'node:path'
import { command, z } from 'clibuilder'
import { dirname } from 'dirname-filename-esm'
import { execa } from 'execa'

export const build = command({
	name: 'build',
	arguments: [
		{
			name: 'type',
			description: 'type of build: cjs, esm, or tslib',
			type: z.union([z.literal('cjs'), z.literal('tslib'), z.literal('esm')]),
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
