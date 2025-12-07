import { copyFile } from 'node:fs/promises'
import { join } from 'node:path'
import { command, z } from 'clibuilder'
import { dirname } from 'dirname-filename-esm'

export const copyCJSPackageJson = command({
	name: 'copy-cjs-package-json',
	description: 'Copy the package.json needed for CommonJS build.',
	alias: ['cpj'],
	arguments: [
		{
			name: 'dir',
			description: 'where to copy the file to. This should be the `outDir` of the CommonJS build',
			type: z.string(),
		},
		{
			name: 'cwd',
			description: 'project directory. Defaults to `process.cwd()`',
		},
	],
	async run({ dir, cwd = process.cwd() }) {
		this.ui.info('copy-cjs-package-json: starts...')
		await copyFile(join(dirname(import.meta), '../nodejs/package.cjs.json'), join(cwd, `./${dir}/package.json`))

		this.ui.info('copy-cjs-package-json: completed')
	},
})
