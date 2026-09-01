import { afterEach, describe, expect, expectTypeOf, it } from 'vitest'
import type { ConfigEnv, Plugin, ViteUserConfig } from 'vitest/config'
import { buddyConfigDefaults, nodeTestPreset } from './index.ts'

function callConfig(plugin: Plugin, userConfig: ViteUserConfig = {}) {
	const hook = plugin.config
	const handler = typeof hook === 'function' ? hook : hook?.handler
	if (!handler) throw new Error(`${plugin.name} does not define a config hook`)
	return handler.call(undefined as never, userConfig, {} as ConfigEnv) as ViteUserConfig
}

describe(`${nodeTestPreset.name}()`, () => {
	describe('TZ', () => {
		afterEach(() => {
			// Reset the TZ environment variable after each test
			delete process.env['TZ']
		})

		it('do not override TZ if already set', () => {
			process.env['TZ'] = 'America/New_York'
			callConfig(nodeTestPreset())
			expect(process.env['TZ']).toBe('America/New_York')
		})

		it('set TZ to GMT', () => {
			callConfig(nodeTestPreset())
			expect(process.env['TZ']).toBe('GMT')
		})
	})

	it('defines name as @repobuddy/vitest/node-preset', () => {
		// using the same name to avoid user accidentally use overlapping plugin
		const r = nodeTestPreset()
		expect(r.name).toBe('@repobuddy/vitest/node-preset')
	})

	it('set environment to node', () => {
		const config = callConfig(nodeTestPreset())
		expect(config.test?.environment).toBe('node')
	})

	it('can include general test', () => {
		const r = nodeTestPreset({ includeGeneralTests: true })
		expect(callConfig(r).test?.include).toEqual(expect.arrayContaining(buddyConfigDefaults.include.testGeneral))
	})

	it('can override environment', () => {
		const r = nodeTestPreset({ environment: 'jsdom' })
		expect(callConfig(r).test?.environment).toBe('jsdom')
	})

	it('should include browser tests when environment is jsdom', () => {
		const r = nodeTestPreset({ environment: 'jsdom' })
		expect(callConfig(r).test?.include).toEqual(expect.arrayContaining(buddyConfigDefaults.include.testBrowser))
	})

	it('should include browser tests when environment is happy-dom', () => {
		const r = nodeTestPreset({ environment: 'happy-dom' })
		expect(callConfig(r).test?.include).toEqual(expect.arrayContaining(buddyConfigDefaults.include.testBrowser))
	})

	describe('return type', () => {
		// https://github.com/repobuddy/repobuddy/issues/610
		it('is exactly vite `Plugin`, never an inferred config shape', () => {
			expectTypeOf(nodeTestPreset()).toEqualTypeOf<Plugin>()
		})

		it('is assignable to vite `PluginOption`', () => {
			const plugins: NonNullable<ViteUserConfig['plugins']> = [nodeTestPreset()]
			expect(plugins).toHaveLength(1)
		})
	})
})
