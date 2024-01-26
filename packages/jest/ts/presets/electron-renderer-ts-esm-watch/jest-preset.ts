import type { Config } from 'jest'
import { configSource, electronRenderer, tsEsm } from '../../configs/index.js'
import { defineWatchPlugins } from '../../fields/index.js'

const preset = {
	...tsEsm,
	...configSource(),
	...electronRenderer,
	...defineWatchPlugins()
} satisfies Config

export default preset
