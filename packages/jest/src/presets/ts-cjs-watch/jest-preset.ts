import type { Config } from 'jest'
import { configSource, node, tsCjs } from '../../configs/index.js'
import { defineWatchPlugins } from '../../fields/index.js'

const tsCjsWatchPreset = {
	...tsCjs,
	...configSource(),
	...node,
	...defineWatchPlugins(),
} satisfies Config

export default tsCjsWatchPreset
