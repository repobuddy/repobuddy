import type { Config } from 'jest'
import { configSource, electronRenderer, tsEsm } from '../../configs/index.js'

const preset = {
	...tsEsm,
	...configSource(),
	...electronRenderer,
} satisfies Config

export default preset
