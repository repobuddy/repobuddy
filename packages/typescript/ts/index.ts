import { type PluginActivationContext } from 'clibuilder'
import { build } from './build.js'

export function activate(cli: PluginActivationContext) {
	cli.addCommand({
		name: 'ts',
		commands: [
			build
		]
	})
}
