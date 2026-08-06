import type { PluginActivationContext } from 'clibuilder'
import { build } from './build.js'
import { copyCJSPackageJson } from './copy_cjs_package_json.js'

export function activate(cli: PluginActivationContext) {
	cli.addCommand({
		name: 'ts',
		commands: [build, copyCJSPackageJson],
	})
}
