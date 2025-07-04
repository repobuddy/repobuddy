import { afterEach, describe, expect, it } from 'vitest'
import { configDefaults, nodeTestPreset } from './index.ts'

describe(`${nodeTestPreset.name}()`, () => {
	describe('TZ', () => {
		afterEach(() => {
			// Reset the TZ environment variable after each test
			delete process.env.TZ
		})

		it('do not override TZ if already set', () => {
			process.env.TZ = 'America/New_York'
			nodeTestPreset().config()
			expect(process.env.TZ).toBe('America/New_York')
		})

		it('set TZ to GMT', () => {
			nodeTestPreset().config()
			expect(process.env.TZ).toBe('GMT')
		})
	})

	it('defines name as @repobuddy/vitest/node-preset', () => {
		// using the same name to avoid user accidentally use overlapping plugin
		const r = nodeTestPreset()
		expect(r.name).toBe('@repobuddy/vitest/node-preset')
	})

	it('set environment to node', () => {
		const config = nodeTestPreset().config()
		expect(config.test?.environment).toBe('node')
	})

	it('can include general test', () => {
		const r = nodeTestPreset({ includeGeneralTests: true })
		expect(r.config().test.include).toEqual(expect.arrayContaining(configDefaults.include.testGeneral))
	})

	it('can override environment', () => {
		const r = nodeTestPreset({ environment: 'jsdom' })
		expect(r.config().test?.environment).toBe('jsdom')
	})

	it('should include browser tests when environment is jsdom', () => {
		const r = nodeTestPreset({ environment: 'jsdom' })
		expect(r.config().test.include).toEqual(expect.arrayContaining(configDefaults.include.testBrowser))
	})

	it('should include browser tests when environment is happy-dom', () => {
		const r = nodeTestPreset({ environment: 'happy-dom' })
		expect(r.config().test.include).toEqual(expect.arrayContaining(configDefaults.include.testBrowser))
	})
})
