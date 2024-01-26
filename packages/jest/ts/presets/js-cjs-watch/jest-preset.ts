import type { Config } from 'jest'
import { jsCjs, node, configSource } from '../../configs/index.js'
import { defineWatchPlugins } from '../../fields/index.js'

const jsCjsPreset = {
	...jsCjs,
	...configSource(),
	...node,
	...defineWatchPlugins()
} satisfies Config

export default jsCjsPreset
