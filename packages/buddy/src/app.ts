import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cli } from 'clibuilder'
import { checkDependenciesCommand } from './deps/check_dependencies_command.js'

const pkg = JSON.parse(readFileSync(resolve('./package.json'), 'utf-8'))

export const app = cli({
	name: 'repobuddy',
	version: pkg.version,
	description: 'Your repo buddy',
	// Load-bearing: this is how clibuilder finds the plugin commands other
	// packages contribute, such as `buddy ts build cjs` from `@repobuddy/typescript`.
	config: true,
}).command(checkDependenciesCommand)
