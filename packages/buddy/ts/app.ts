import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cli } from 'clibuilder'

const pkg = JSON.parse(readFileSync(resolve('./package.json'), 'utf-8'))

export const app = cli({
	name: 'repobuddy',
	version: pkg.version,
	description: 'Your repo buddy',
	config: true,
})
