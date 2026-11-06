import { existsSync } from 'node:fs'
import { join } from 'node:path'
import type { PluginActivationContext } from '@clibuilder/plugins'
import { command, empty, result } from 'clibuilder'
import { build } from './build.js'
import { copyCJSPackageJson } from './copy_cjs_package_json.js'

const types = ['cjs', 'tslib', 'esm'] as const

const ts = command({
	name: 'ts',
	description: 'TypeScript build commands.',
	commands: [build, copyCJSPackageJson],
	examples: [{ command: 'buddy ts', description: 'List the builds this project can run' }],
	run() {
		const builds = types.filter((type) => existsSync(join(process.cwd(), `tsconfig.${type}.json`)))
		const help = [
			'Run `buddy ts build <type>` to compile one',
			'Run `buddy ts copy-cjs-package-json <dir>` to mark a CommonJS output directory',
		]
		if (builds.length === 0) return empty('0 builds found: no tsconfig.<cjs|tslib|esm>.json here', { help })
		return result({ builds }, { help })
	},
})

export function activate(cli: PluginActivationContext) {
	cli.addCommand(ts)
}
