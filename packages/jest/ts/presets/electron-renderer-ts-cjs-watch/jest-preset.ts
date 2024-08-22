import type { Config } from 'jest'
import { configSource, electronRenderer, tsCjs } from '../../configs/index.js'
import { defineWatchPlugins } from '../../fields/index.js'

const preset = {
	...tsCjs,
	...configSource(),
	...electronRenderer,
	...defineWatchPlugins(),
} satisfies Config

export default preset
