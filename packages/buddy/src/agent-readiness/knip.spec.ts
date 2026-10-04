import { describe, expect, it } from '@jest/globals'
import { readKnipRun } from './knip.js'

const REPORT = `\x1b[33mUnused files (2)\x1b[0m
src/a.ts
src/b.ts
Unused exports (4)
foo  function  src/c.ts:1:17
`

describe('readKnipRun', () => {
	it('reads exit 0 as clean', () => {
		expect(readKnipRun('pnpm knip', 0, '')).toEqual({ command: 'pnpm knip', outcome: 'clean', groups: [] })
	})

	it('reads exit 1 with report headings as found, stripping color', () => {
		expect(readKnipRun('pnpm knip', 1, REPORT)).toEqual({
			command: 'pnpm knip',
			outcome: 'found',
			groups: ['Unused files (2)', 'Unused exports (4)'],
		})
	})

	it('reads exit 1 without a report as an error, naming the first line', () => {
		expect(readKnipRun('npm run knip', 1, '\nsh: knip: not found\n')).toMatchObject({
			outcome: 'error',
			error: 'exit 1: sh: knip: not found',
		})
	})

	it('reads other exits, timeouts, and spawn errors as errors', () => {
		expect(readKnipRun('pnpm knip', 2, '')).toMatchObject({ outcome: 'error', error: 'exit 2' })
		expect(readKnipRun('pnpm knip', null, '')).toMatchObject({ outcome: 'error', error: 'timed out' })
		expect(readKnipRun('pnpm knip', null, '', 'spawn ENOENT')).toMatchObject({
			outcome: 'error',
			error: 'spawn ENOENT',
		})
	})
})
