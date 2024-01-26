import type { Config } from 'jest'
import { configSource, electron, tsEsm } from '../../configs/index.js'
import { defineWatchPlugins } from '../../fields/index.js'

const preset = {
	...tsEsm,
	...configSource(),
	...electron,
	...defineWatchPlugins()
} satisfies Config

export default preset
