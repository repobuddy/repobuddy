import { describe, expect, it } from '@jest/globals'
import { defineModuleNameMappers, knownModuleNameMappers } from './moduleNameMapper.js'

describe(`${defineModuleNameMappers.name}()`, () => {
	it('combine multiple entries together', () => {
		const r = defineModuleNameMappers(knownModuleNameMappers.tsEsm, knownModuleNameMappers.cssAll)
		expect(r).toEqual({
			'^(\\.{1,2}/.*)\\.js$': '$1',
			'\\.module\\.css$': 'identity-obj-proxy',
			'.+\\.(css|styl|less|sass|scss)$': 'identity-obj-proxy',
		})
	})
})
