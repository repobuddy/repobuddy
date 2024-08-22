import type { Config } from 'jest'
import { configSource, jsEsm, node } from '../../configs/index.js'
import { defineWatchPlugins } from '../../fields/index.js'

const jsEsmPreset = {
	...jsEsm,
	...configSource(),
	...node,
	...defineWatchPlugins(),
} satisfies Config

export default jsEsmPreset
