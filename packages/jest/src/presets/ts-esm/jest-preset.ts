import type { Config } from 'jest'
import { configSource, node, tsEsm } from '../../configs/index.js'

const tsEsmPreset = {
	...tsEsm,
	...configSource(),
	...node,
} satisfies Config

export default tsEsmPreset
