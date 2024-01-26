import type { Config } from 'jest'
import { configSource, jsdom, tsEsm } from '../../configs/index.js'

const jsdomTsEsmPreset = {
	...tsEsm,
	...configSource(),
	...jsdom
} satisfies Config

export default jsdomTsEsmPreset
