import type { Config } from 'jest'
import { configSource, jsEsm, node } from '../../configs/index.js'

const jsEsmPreset = {
	...jsEsm,
	...configSource(),
	...node,
} satisfies Config

export default jsEsmPreset
