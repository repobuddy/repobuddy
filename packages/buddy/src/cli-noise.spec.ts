import { expect, it } from '@jest/globals'
import { installMissingConfigWarningFilter } from './cli-noise.js'

it('filters exactly the "no config found" warning and lets any other warning through', () => {
	const seen: unknown[][] = []
	console.warn = (...args: unknown[]) => {
		seen.push(args)
	}
	installMissingConfigWarningFilter()

	console.warn(`no config found under '/tmp/some-dir':\n  .repobuddy.json\n  .repobuddyrc`)
	console.warn('a real warning')

	expect(seen).toEqual([['a real warning']])
})
