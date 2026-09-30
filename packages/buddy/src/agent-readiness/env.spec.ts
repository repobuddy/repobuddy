import { describe, expect, it } from '@jest/globals'
import { findUndocumentedEnv, isSetupDoc, readEnvNames } from './env.js'

describe('readEnvNames', () => {
	it('reads the dot and bracket forms of process.env and import.meta.env', () => {
		expect(
			readEnvNames(
				`process.env.A; process.env['B']; process.env["C"]; import.meta.env.D; import.meta.env[\`E\`]; process.env.A`,
			),
		).toEqual(['A', 'B', 'C', 'D', 'E'])
	})

	it('ignores computed keys and other objects', () => {
		expect(readEnvNames('process.env[name]; env.X; myprocess.env.Y')).toEqual([])
	})
})

describe('isSetupDoc', () => {
	it('matches READMEs, CONTRIBUTING, and env example files at any depth', () => {
		expect(isSetupDoc('README.md')).toBe(true)
		expect(isSetupDoc('packages/a/readme.md')).toBe(true)
		expect(isSetupDoc('.github/CONTRIBUTING.md')).toBe(true)
		expect(isSetupDoc('.env.example')).toBe(true)
		expect(isSetupDoc('apps/web/.env.local.sample')).toBe(true)
		expect(isSetupDoc('.env')).toBe(false)
		expect(isSetupDoc('docs/readme-guide.md')).toBe(false)
	})
})

describe('findUndocumentedEnv', () => {
	const texts: Record<string, string> = {
		'src/a.ts': 'process.env.API_URL; process.env.CI; process.env.npm_package_version; process.env.GITHUB_SHA',
		'src/a.test.ts': 'process.env.ONLY_IN_TESTS',
		'README.md': 'API_URL_V2 is not API_URL',
	}
	const read = (path: string) => texts[path]

	it('skips test files and well-known names, and matches whole words only', () => {
		expect(findUndocumentedEnv(['src/a.ts', 'src/a.test.ts'], [], read)).toEqual([
			{ name: 'API_URL', readIn: 'src/a.ts' },
		])
		expect(findUndocumentedEnv(['src/a.ts'], ['README.md'], read)).toEqual([])
	})

	it('is undefined without JS or TS source', () => {
		expect(findUndocumentedEnv(['README.md', 'main.py'], ['README.md'], read)).toBeUndefined()
	})
})
