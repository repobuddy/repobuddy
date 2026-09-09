import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from '@jest/globals'
import { testCommand } from 'clibuilder'
import { detectTestRunners, planTestScripts, testScripts } from './test_scripts.js'

let cwd: string

beforeEach(() => {
	cwd = mkdtempSync(join(tmpdir(), 'repobuddy-test-scripts-'))
})

function writeManifest(pkg: Record<string, any>, { indent = '\t', newline = true } = {}) {
	writeFileSync(join(cwd, 'package.json'), `${JSON.stringify(pkg, undefined, indent)}${newline ? '\n' : ''}`)
}

function readManifest() {
	return JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf-8'))
}

function run(argv = '') {
	return testCommand(testScripts, `test-scripts --cwd ${cwd} ${argv}`.trim())
}

describe('detectTestRunners()', () => {
	it('finds the runner a project depends on directly', () => {
		expect(detectTestRunners({ devDependencies: { jest: '^30.0.0' } })).toEqual(['jest'])
		expect(detectTestRunners({ devDependencies: { vitest: '^4.0.0' } })).toEqual(['vitest'])
	})

	it('finds the runner behind a repobuddy preset', () => {
		expect(detectTestRunners({ devDependencies: { '@repobuddy/vitest': '^2.0.0' } })).toEqual(['vitest'])
	})

	it('finds nothing when the project depends on neither', () => {
		expect(detectTestRunners({ devDependencies: { typescript: '^7.0.0' } })).toEqual([])
	})

	it('finds both when the project depends on both', () => {
		expect(detectTestRunners({ devDependencies: { jest: '^30.0.0', vitest: '^4.0.0' } })).toEqual(['jest', 'vitest'])
	})
})

describe('planTestScripts()', () => {
	it('adds every managed script a project does not have', () => {
		expect(planTestScripts({}, 'jest')).toEqual([
			{ name: 'test', action: 'add', to: 'jest' },
			{ name: 'coverage', action: 'add', to: 'jest --coverage' },
			{ name: 'test:watch', action: 'add', to: 'jest --watch' },
		])
	})

	it('leaves a script the project customized alone', () => {
		const changes = planTestScripts({ scripts: { test: 'cross-env NODE_ENV=test jest' } }, 'jest')
		expect(changes[0]).toEqual({
			name: 'test',
			action: 'skip',
			from: 'cross-env NODE_ENV=test jest',
			to: 'cross-env NODE_ENV=test jest',
		})
	})

	it('adjusts a script still holding the value written for the other runner', () => {
		const changes = planTestScripts({ scripts: { test: 'jest', coverage: 'jest --coverage' } }, 'vitest')
		expect(changes[0]).toEqual({ name: 'test', action: 'adjust', from: 'jest', to: 'vitest run' })
		expect(changes[1]).toEqual({
			name: 'coverage',
			action: 'adjust',
			from: 'jest --coverage',
			to: 'vitest run --coverage',
		})
	})
})

describe('test-scripts', () => {
	it('adds the jest scripts to a project using jest', async () => {
		writeManifest({ name: 'p', devDependencies: { jest: '^30.0.0' } })

		const { messages, exitCode } = await run()

		expect(exitCode).toBeUndefined()
		expect(readManifest().scripts).toEqual({
			test: 'jest',
			coverage: 'jest --coverage',
			'test:watch': 'jest --watch',
		})
		expect(messages).toContain('added "test": jest')
	})

	it('adds the vitest scripts to a project using vitest', async () => {
		writeManifest({ name: 'p', devDependencies: { '@repobuddy/vitest': '^2.0.0' } })

		await run()

		expect(readManifest().scripts).toEqual({
			test: 'vitest run',
			coverage: 'vitest run --coverage',
			'test:watch': 'vitest',
		})
	})

	it('keeps the scripts a project already has beside the ones it adds', async () => {
		writeManifest({ name: 'p', devDependencies: { jest: '^30.0.0' }, scripts: { build: 'tsc' } })

		await run()

		expect(readManifest().scripts.build).toBe('tsc')
	})

	it('changes nothing on a second run', async () => {
		writeManifest({ name: 'p', devDependencies: { jest: '^30.0.0' } })

		await run()
		const afterFirst = readFileSync(join(cwd, 'package.json'), 'utf-8')
		const { messages } = await run()

		expect(readFileSync(join(cwd, 'package.json'), 'utf-8')).toBe(afterFirst)
		expect(messages).toContain('the jest scripts are already what they should be')
	})

	it('leaves a customized script alone and reports it', async () => {
		writeManifest({
			name: 'p',
			devDependencies: { jest: '^30.0.0' },
			scripts: { test: 'cross-env NODE_OPTIONS=--experimental-vm-modules jest' },
		})

		const { messages } = await run()

		expect(readManifest().scripts.test).toBe('cross-env NODE_OPTIONS=--experimental-vm-modules jest')
		expect(messages).toContain('skipped "test": cross-env NODE_OPTIONS=--experimental-vm-modules jest')
	})

	it('adjusts the scripts of a project that moved from jest to vitest', async () => {
		writeManifest({
			name: 'p',
			devDependencies: { vitest: '^4.0.0' },
			scripts: { test: 'jest', coverage: 'jest --coverage', 'test:watch': 'jest --watch' },
		})

		const { messages } = await run()

		expect(readManifest().scripts).toEqual({
			test: 'vitest run',
			coverage: 'vitest run --coverage',
			'test:watch': 'vitest',
		})
		expect(messages).toContain('adjusted "test": jest -> vitest run')
	})

	it('fails when the project depends on no test runner', async () => {
		writeManifest({ name: 'p', devDependencies: { typescript: '^7.0.0' } })

		const { messages, exitCode } = await run()

		expect(exitCode).toBe(1)
		expect(messages).toContain('depends on neither jest nor vitest')
		expect(messages).toContain('--runner jest|vitest')
	})

	it('fails when the project depends on both test runners', async () => {
		writeManifest({ name: 'p', devDependencies: { jest: '^30.0.0', vitest: '^4.0.0' } })

		const { exitCode, messages } = await run()

		expect(exitCode).toBe(1)
		expect(messages).toContain('depends on jest and vitest')
	})

	it('writes the runner named by --runner instead of the detected one', async () => {
		writeManifest({ name: 'p', devDependencies: { jest: '^30.0.0', vitest: '^4.0.0' } })

		const { exitCode } = await run('--runner vitest')

		expect(exitCode).toBeUndefined()
		expect(readManifest().scripts.test).toBe('vitest run')
	})

	it('fails when there is no package.json to adjust', async () => {
		const { exitCode, messages } = await run()

		expect(exitCode).toBe(1)
		expect(messages).toContain('no package.json in')
	})

	it('keeps the indentation and the trailing newline the manifest had', async () => {
		writeManifest({ name: 'p', devDependencies: { jest: '^30.0.0' } }, { indent: '  ' })

		await run()

		const source = readFileSync(join(cwd, 'package.json'), 'utf-8')
		expect(source).toContain('\n  "name": "p"')
		expect(source.endsWith('\n')).toBe(true)
	})
})
