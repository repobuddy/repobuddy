import type { Config } from 'jest'
import { configSource, node, tsCjs } from '../../configs/index.js'

const tsCjsPreset = {
	...tsCjs,
	...configSource(),
	...node
} satisfies Config

export default tsCjsPreset
