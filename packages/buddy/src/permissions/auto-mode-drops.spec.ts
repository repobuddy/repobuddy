import { describe, expect, it } from '@jest/globals'
import { droppedInAutoMode } from './auto-mode-drops.js'

describe('droppedInAutoMode', () => {
	it.each([
		['Agent', '', '`Agent` allow rules'],
		['Monitor', '', '`Monitor` allow rules'],
		['Bash', '', 'blanket `Bash(*)`'],
		['Bash', '*', 'blanket `Bash(*)`'],
		['PowerShell', '*', 'blanket `PowerShell(*)`'],
		['Bash', 'pnpm run:*', 'a package-manager run command'],
		['Bash', 'npx', 'a package-manager run command'],
		['Bash', 'python*', 'an interpreter'],
		['Bash', 'sh  -c *', 'an inline-code interpreter'],
		['Bash', 'xargs *', 'a command that runs another command'],
	])('drops %s(%s) as %s', (tool, arg, kind) => {
		expect(droppedInAutoMode(tool, arg)).toBe(kind)
	})

	it.each([
		['Read', '*'],
		['PowerShell', 'Get-ChildItem *'],
		['Bash', 'pnpm test *'],
		['Bash', 'npm run test *'],
		['Bash', 'pnpm *'],
		['Bash', 'deno run *'],
	])('keeps %s(%s)', (tool, arg) => {
		expect(droppedInAutoMode(tool, arg)).toBeNull()
	})
})
