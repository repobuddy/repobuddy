import { afterEach, describe, expect, it } from 'vitest'
import { browserTestPreset } from './browser.ts'
import { configDefaults } from './config-defaults.ts'

describe(`${browserTestPreset.name}()`, () => {
	it('defines name as @repobuddy/vitest/browser-preset', () => {
		// using the same name to avoid user accidentally use overlapping plugin
		const r = browserTestPreset()
		expect(r.name).toBe('@repobuddy/vitest/browser-preset')
	})

	it('uses playwright', () => {
		const r = browserTestPreset()
		expect(r.config().test.browser.provider).toBe('playwright')
	})

	it('honors include from config', () => {
		const r = browserTestPreset()
		expect(
			r.config({
				test: {
					include: ['x'],
				},
			}).test.include,
		).toContain('x')
	})

	it('include browser specific tests', () => {
		const r = browserTestPreset()
		expect(r.config().test.include).toEqual(configDefaults.include.testBrowser)
	})

	it('can include general tests', () => {
		const r = browserTestPreset({ includeGeneralTests: true })
		const include = r.config().test.include
		configDefaults.include.testGeneral.forEach((item) => expect(include).toContain(item))
	})

	it('honors browser from config', () => {
		const r = browserTestPreset()
		expect(
			r.config({
				test: {
					browser: {
						instances: [
							{
								browser: 'firefox',
							},
						],
					},
				},
			}).test.browser.instances,
		).toEqual([
			{
				browser: 'firefox',
			},
		])
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
		expect(r.config().test.browser.screenshotFailures).toEqual(false)
	})

	describe('TZ', () => {
		afterEach(() => {
			// Reset the TZ environment variable after each test
			// biome-ignore lint/performance/noDelete: on purpose
			delete process.env.TZ
		})

		it('do not override TZ if already set', () => {
			process.env.TZ = 'America/New_York'
			browserTestPreset().config()
			expect(process.env.TZ).toBe('America/New_York')
		})

		it('set TZ to GMT', () => {
			browserTestPreset().config()
			expect(process.env.TZ).toBe('GMT')
		})
	})
})
