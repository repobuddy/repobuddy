import type { Config } from 'jest'
import { configSource, jsCjs, node } from '../../configs/index.js'

const jsCjsPreset = {
	...jsCjs,
	...configSource(),
	...node,
} satisfies Config

export default jsCjsPreset
