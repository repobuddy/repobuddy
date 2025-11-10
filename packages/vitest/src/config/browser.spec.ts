import { describe, expect, it } from 'vitest'
import { browserTestPreset } from './browser.ts'
import { buddyConfigDefaults } from './buddy_config_defaults.ts'

describe(`${browserTestPreset.name}()`, () => {
	it('defines name as @repobuddy/vitest/browser-preset', () => {
		// using the same name to avoid user accidentally use overlapping plugin
		const r = browserTestPreset()
		expect(r.name).toBe('@repobuddy/vitest/browser-preset')
	})

	it('uses playwright', () => {
		const r = browserTestPreset()
		expect(r.config().test.browser.provider).toSatisfy((v) => v.name === 'playwright')
	})

	it('include browser specific tests', () => {
		const r = browserTestPreset()
		expect(r.config().test.include).toEqual(buddyConfigDefaults.include.testBrowser)
	})

	it('can include general tests', () => {
		const r = browserTestPreset({ includeGeneralTests: true })
		const include = r.config().test.include
		buddyConfigDefaults.include.testGeneral.forEach((item) => void expect(include).toContain(item))
	})

	it('supports config without name', () => {
		const r = browserTestPreset()
		expect(
			r.config({
				test: {},
			}).test.browser.instances?.[0]?.name,
		).toBeUndefined()
	})

	it('supports config with name', () => {
		const r = browserTestPreset()
		expect(
			r.config({
				test: {
					name: 'My Test',
				},
			}).test.browser.instances?.[0]?.name,
		).toEqual('My Test (chromium)')
	})

	it('disable screenshot on failure', () => {
		// The screenshot created relative to the source causes Storybook unable to load.
		// A fix is on the way, but for the time being, disable it.
		//https://discord.com/channels/486522875931656193/1301551207835504694/1344808226428030998
		const r = browserTestPreset()
		expect(r.config().test.browser.instances?.[0]?.screenshotFailures).toEqual(false)
	})
})
