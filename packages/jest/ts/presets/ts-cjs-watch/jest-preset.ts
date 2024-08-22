import type { Config } from 'jest'
import { node, tsCjs, configSource } from '../../configs/index.js'
import { defineWatchPlugins } from '../../fields/index.js'

const tsCjsWatchPreset = {
	...tsCjs,
	...configSource(),
	...node,
	...defineWatchPlugins(),
} satisfies Config

export default tsCjsWatchPreset
