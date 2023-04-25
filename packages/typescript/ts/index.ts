import { PluginActivationContext, command, z } from 'clibuilder'
import { execa } from 'execa'
import { copyFile } from 'fs/promises'
import { join } from 'path'

export function activate(cli: PluginActivationContext) {
	cli.addCommand({
		name: 'ts',
		commands: [
			command({
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
					await copyFile('./nodejs/package.cjs.json', join(process.cwd(), `./cjs/package.json`))
					this.ui.info('build ${type} done')
				}
			})
		]
	})
}
