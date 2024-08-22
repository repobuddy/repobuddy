import type { Config } from 'jest'
import { configSource, jsdom, tsEsm } from '../../configs/index.js'
import { defineWatchPlugins } from '../../fields/index.js'

const jsdomTsEsmWatchPreset = {
	...tsEsm,
	...configSource(),
	...jsdom,
	...defineWatchPlugins(),
} satisfies Config

export default jsdomTsEsmWatchPreset
