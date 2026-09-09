import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from '@jest/globals'
import { checkDependencies } from './check_dependencies.js'

const created: string[] = []

/**
 * Stand up a throwaway project on disk.
 *
 * It lives under this package's own `node_modules` so that node resolves
 * specifiers from it exactly as it would for a consumer that installed them:
 * the preset these tests follow is a real, installed `@repobuddy/jest`.
 */
async function project(files: Record<string, unknown>) {
	const dir = await mkdtemp(join(process.cwd(), 'node_modules', '.repobuddy-check-deps-'))
	created.push(dir)
	for (const [name, content] of Object.entries(files)) {
		await writeFile(join(dir, name), JSON.stringify(content), 'utf-8')
	}
	return dir
}

afterAll(() => Promise.all(created.map((dir) => rm(dir, { recursive: true, force: true }))))

describe(`${checkDependencies.name}()`, () => {
	it('reports nothing to check when the project configures no jest', async () => {
		const report = await checkDependencies(await project({ 'package.json': { name: 'no-jest' } }))
		expect(report).toMatchObject({
			project: 'no-jest',
			from: undefined,
			required: [],
			missing: [],
			warnings: [],
		})
	})

	it('takes the package manager from the workspace root when the project declares none', async () => {
		const dir = await project({ 'package.json': { name: 'consumer' } })
		expect(await checkDependencies(dir)).toMatchObject({ packageManager: expect.stringContaining('pnpm@') })
	})

	it('follows the preset and reports what the preset needs but the project has not installed', async () => {
		const dir = await project({
			'package.json': { name: 'consumer' },
			'jest.config.json': { preset: '@repobuddy/jest/presets/ts-cjs-watch' },
		})

		const report = await checkDependencies(dir)
		const missing = report.missing.map((dep) => dep.name)

		expect(report.from).toBe('jest.config.json')
		expect(report.warnings).toEqual([])
		// Named by the project's own config.
		expect(missing).toContain('@repobuddy/jest')
		// Named by the preset, which is the whole point of following it.
		expect(missing).toEqual(
			expect.arrayContaining(['ts-jest', 'jest-esm-transformer-2', 'jest-watch-suspend', 'jest-watch-typeahead']),
		)
		// Bundled with jest, so never anyone's missing dependency.
		expect(missing).not.toContain('jest-environment-node')
	})

	it('attributes each requirement to the config that asked for it', async () => {
		const dir = await project({
			'package.json': { name: 'consumer' },
			'jest.config.json': { preset: '@repobuddy/jest/presets/ts-cjs-watch' },
		})

		const report = await checkDependencies(dir)

		expect(report.missing.find((dep) => dep.name === '@repobuddy/jest')?.sources).toEqual(['jest.config.json preset'])
		expect(report.missing.find((dep) => dep.name === 'jest-watch-suspend')?.sources).toEqual([
			'preset(@repobuddy/jest/presets/ts-cjs-watch) watchPlugins',
		])
	})

	it('reports nothing missing when the project declares what its config uses', async () => {
		const dir = await project({
			'package.json': {
				name: 'consumer',
				devDependencies: { 'ts-jest': '^29', 'jest-watch-typeahead': '^3' },
			},
			'jest.config.json': {
				transform: { '^.+\\.ts$': 'ts-jest' },
				watchPlugins: ['jest-watch-typeahead/filename'],
			},
		})

		const report = await checkDependencies(dir)

		expect(report.required).toHaveLength(2)
		expect(report.missing).toEqual([])
	})

	it('stops when a preset chain points back at itself', async () => {
		// A real installed package, because the cycle is only reachable through
		// real module resolution.
		const pkg = join(process.cwd(), 'node_modules', 'jest-preset-repobuddy-cycle-fixture')
		await mkdir(pkg, { recursive: true })
		created.push(pkg)
		await writeFile(join(pkg, 'package.json'), JSON.stringify({ name: pkg, version: '0.0.0' }), 'utf-8')
		await writeFile(
			join(pkg, 'jest-preset.json'),
			JSON.stringify({ preset: 'jest-preset-repobuddy-cycle-fixture', transform: { '^.+$': 'ts-jest' } }),
			'utf-8',
		)

		const dir = await project({
			'package.json': { name: 'consumer' },
			'jest.config.json': { preset: 'jest-preset-repobuddy-cycle-fixture' },
		})

		const report = await checkDependencies(dir)

		expect(report.warnings).toEqual([])
		expect(report.missing.map((dep) => dep.name)).toEqual(['jest-preset-repobuddy-cycle-fixture', 'ts-jest'])
	})

	it('warns rather than fails when a preset will not load, and still reports the preset itself', async () => {
		const dir = await project({
			'package.json': { name: 'consumer' },
			'jest.config.json': { preset: 'jest-preset-that-is-not-installed' },
		})

		const report = await checkDependencies(dir)

		expect(report.warnings).toEqual(['could not load preset "jest-preset-that-is-not-installed"'])
		expect(report.missing).toEqual([
			{ name: 'jest-preset-that-is-not-installed', sources: ['jest.config.json preset'] },
		])
	})
})
