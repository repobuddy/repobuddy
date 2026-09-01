import { describe, expect, expectTypeOf, it } from 'vitest'
import type { ConfigEnv, Plugin, ViteUserConfig } from 'vitest/config'
import { browserTestPreset } from './browser_test_preset.ts'
import { buddyConfigDefaults } from './buddy_config_defaults.ts'

function callConfig(plugin: Plugin, userConfig: ViteUserConfig = {}) {
	const hook = plugin.config
	const handler = typeof hook === 'function' ? hook : hook?.handler
	if (!handler) throw new Error(`${plugin.name} does not define a config hook`)
	return handler.call(undefined as never, userConfig, {} as ConfigEnv) as ViteUserConfig
}

describe(`${browserTestPreset.name}()`, () => {
	it('defines name as @repobuddy/vitest/browser-preset', () => {
		// using the same name to avoid user accidentally use overlapping plugin
		const r = browserTestPreset()
		expect(r.name).toBe('@repobuddy/vitest/browser-preset')
	})

	it('uses playwright', () => {
		const r = browserTestPreset()
		expect(callConfig(r).test?.browser?.provider).toSatisfy((v: { name: string }) => v.name === 'playwright')
	})

	it('include browser specific tests', () => {
		const r = browserTestPreset()
		expect(callConfig(r).test?.include).toEqual(buddyConfigDefaults.include.testBrowser)
	})

	it('can include general tests', () => {
		const r = browserTestPreset({ includeGeneralTests: true })
		const include = callConfig(r).test?.include
		buddyConfigDefaults.include.testGeneral.forEach((item) => void expect(include).toContain(item))
	})

	it('supports config without name', () => {
		const r = browserTestPreset()
		expect(callConfig(r, { test: {} }).test?.browser?.instances?.[0]?.name).toBeUndefined()
	})

	it('supports config with name', () => {
		const r = browserTestPreset()
		expect(callConfig(r, { test: { name: 'My Test' } }).test?.browser?.instances?.[0]?.name).toEqual(
			'My Test (chromium)',
		)
	})

	it('disable screenshot on failure', () => {
		// The screenshot created relative to the source causes Storybook unable to load.
		// A fix is on the way, but for the time being, disable it.
		//https://discord.com/channels/486522875931656193/1301551207835504694/1344808226428030998
		const r = browserTestPreset()
		expect(callConfig(r).test?.browser?.instances?.[0]?.screenshotFailures).toEqual(false)
	})

	describe('return type', () => {
		// https://github.com/repobuddy/repobuddy/issues/610
		// An inferred return type leaks the config shape into the emitted `.d.ts`.
		// `test.browser.instances[].browser` is typed against the augmentable `_BrowserNames`
		// interface, so it resolves differently here than in a consumer that installs a
		// browser provider, and the emitted type stops being assignable there.
		it('is exactly vite `Plugin`, never an inferred config shape', () => {
			expectTypeOf(browserTestPreset()).toEqualTypeOf<Plugin>()
		})

		it('is assignable to vite `PluginOption`', () => {
			const plugins: NonNullable<ViteUserConfig['plugins']> = [browserTestPreset()]
			expect(plugins).toHaveLength(1)
		})
	})
})
