import type { Config } from 'jest'
import { configSource, electronRenderer, tsCjs } from '../../configs/index.js'

const preset = {
	...tsCjs,
	...configSource(),
	...electronRenderer,
} satisfies Config

export default preset
