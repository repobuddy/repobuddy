import { cli } from 'clibuilder'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const pkg = JSON.parse(readFileSync(resolve('./package.json'), 'utf-8'))

export const app = cli({
	name: 'repobuddy',
	version: pkg.version,
	description: 'Your repo buddy',
	config: true
})
