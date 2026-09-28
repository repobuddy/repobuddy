import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from '@jest/globals'
import { testCommand } from 'clibuilder'
import { checkDependenciesCommand } from './check_dependencies_command.js'

const created: string[] = []

async function project(files: Record<string, unknown>) {
	const dir = await mkdtemp(join(process.cwd(), 'node_modules', '.repobuddy-check-deps-cmd-'))
	created.push(dir)
	for (const [name, content] of Object.entries(files)) {
		await writeFile(join(dir, name), JSON.stringify(content), 'utf-8')
	}
	return dir
}

afterAll(() => Promise.all(created.map((dir) => rm(dir, { recursive: true, force: true }))))

describe('check-deps', () => {
	it('succeeds and says so when every used package is declared', async () => {
		const dir = await project({
			'package.json': { name: 'consumer', devDependencies: { 'ts-jest': '^29' } },
			'jest.config.json': { transform: { '^.+\\.ts$': 'ts-jest' } },
		})

		const { messages, exitCode } = await testCommand(checkDependenciesCommand, `check-deps --cwd=${dir}`)

		expect(exitCode).toBeUndefined()
		expect(messages).toContain('all declared in package.json')
	})

	it('fails with the missing packages and how to install them', async () => {
		const dir = await project({
			'package.json': { name: 'consumer', packageManager: 'pnpm@12.3.4' },
			'jest.config.json': { transform: { '^.+\\.ts$': 'ts-jest' } },
		})

		const { messages, exitCode } = await testCommand(checkDependenciesCommand, `check-deps --cwd=${dir}`)

		expect(exitCode).toBe(1)
		expect(messages).toContain('missing dependencies: 1 used by jest.config.json')
		expect(messages).toContain('ts-jest')
		expect(messages).toContain('install: pnpm add -D ts-jest')
	})

	it('reports a directory it cannot read instead of leaking the underlying error', async () => {
		const { messages, exitCode } = await testCommand(checkDependenciesCommand, 'check-deps --cwd=/no/such/project')

		expect(exitCode).toBe(1)
		expect(messages).toContain('cannot read the project at /no/such/project')
		expect(messages).toContain('check-deps needs a directory with a package.json')
	})

	it('is available under its long alias', async () => {
		const dir = await project({ 'package.json': { name: 'consumer' } })

		const { messages, exitCode } = await testCommand(checkDependenciesCommand, `check-dependencies --cwd=${dir}`)

		expect(exitCode).toBeUndefined()
		expect(messages).toContain('no jest configuration found')
	})
})
