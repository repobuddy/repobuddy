import { command, z } from 'clibuilder'
import { dirname } from 'dirname-filename-esm'
import { execa } from 'execa'
import { copyFile } from 'fs/promises'
import { join } from 'path'

export const build = command({
	name: 'build',
	arguments: [
		{
			name: 'type',
			description: 'type of build: cjs or tslib',
			type: z.literal('cjs').or(z.literal('tslib'))
		}
	],
	async run({ type }) {
		this.ui.info(`building ${type}...`)
		await execa('tsc', ['-p', `tsconfig.${type}.json`])
		this.ui.info('copying package.json...')
		await copyFile(
			join(dirname(import.meta), '../nodejs/package.cjs.json'),
			join(process.cwd(), `./${type}/package.json`)
		)
		this.ui.info(`build ${type} done`)
	}
})
