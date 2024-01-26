import type { Config } from 'jest'
import { configSource, jsdom, tsCjs } from '../../configs/index.js'
import { defineWatchPlugins } from '../../fields/index.js'

const jsdomTsCjsWatchPreset = {
	...tsCjs,
	...configSource(),
	...jsdom,
	...defineWatchPlugins()
} satisfies Config

export default jsdomTsCjsWatchPreset
