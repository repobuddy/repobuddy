import { readFileSync } from 'node:fs'
import { plugins } from '@clibuilder/plugins'
import { cli } from 'clibuilder'
import { config } from 'clibuilder/config'
import { installMissingConfigWarningFilter } from './cli-noise.js'
import { checkDependenciesCommand } from './deps/check_dependencies_command.js'
import { testScripts } from './test_scripts.js'

// `cli({ config: true })` below resolves the repobuddy config as a side effect of this module
// loading, which is also when clibuilder binds `console.warn` for the rest of the process. This
// has to run first — see cli-noise.ts for why.
installMissingConfigWarningFilter()

// Both `src/app.ts` and the bundled `esm/bin.js` sit one level below the package root.
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))

export const app = cli({
	name: 'repobuddy',
	version: pkg.version,
	description: 'Your repo buddy',
})
	.use(config())
	.use(plugins())
	.command(testScripts)
	.command(checkDependenciesCommand)
