import { beforeEach, describe, expect, it } from '@jest/globals'
import { ctx } from './load_jest_config.ctx.js'
import { loadJestConfig, loadPreset, readManifest } from './load_jest_config.js'

const original = { ...ctx }

/**
 * Stand a project up in memory: `files` maps a path to its text, `modules`
 * maps a path to what importing it yields, and `resolved` maps a specifier to
 * the path it resolves to.
 */
function project(setup: {
	files?: Record<string, string>
	modules?: Record<string, Record<string, unknown>>
	resolved?: Record<string, string>
}) {
	const files = setup.files ?? {}
	const modules = setup.modules ?? {}
	const resolved = setup.resolved ?? {}
	ctx.existsSync = (path) => String(path) in files || String(path) in modules
	ctx.readFile = (async (path: string) => {
		const content = files[String(path)]
		if (content === undefined) throw new Error(`ENOENT: ${path}`)
		return content
	}) as typeof ctx.readFile
	ctx.importModule = async (path) => {
		const module = modules[path]
		if (!module) throw new Error(`cannot import ${path}`)
		return module
	}
	ctx.resolveFrom = (_cwd, specifier) => {
		const path = resolved[specifier]
		if (!path) throw new Error(`cannot resolve ${specifier}`)
		return path
	}
}

beforeEach(() => {
	Object.assign(ctx, original)
})

describe(`${readManifest.name}()`, () => {
	it('reads the package.json of the project', async () => {
		project({ files: { '/p/package.json': '{"name":"my-lib"}' } })
		expect(await readManifest('/p')).toEqual({ name: 'my-lib' })
	})
})

describe(`${loadJestConfig.name}()`, () => {
	it('loads a jest.config.mjs', async () => {
		project({
			files: { '/p/package.json': '{}' },
			modules: { '/p/jest.config.mjs': { default: { preset: 'a-preset' } } },
		})
		expect(await loadJestConfig('/p')).toEqual({ config: { preset: 'a-preset' }, from: 'jest.config.mjs' })
	})

	it('prefers a config file over the package.json field, as jest does', async () => {
		project({
			files: { '/p/package.json': '{"jest":{"preset":"from-manifest"}}' },
			modules: { '/p/jest.config.js': { default: { preset: 'from-file' } } },
		})
		expect((await loadJestConfig('/p'))?.config).toEqual({ preset: 'from-file' })
	})

	it('reads a jest.config.json without importing it', async () => {
		project({ files: { '/p/package.json': '{}', '/p/jest.config.json': '{"preset":"a-preset"}' } })
		expect(await loadJestConfig('/p')).toEqual({ config: { preset: 'a-preset' }, from: 'jest.config.json' })
	})

	it('falls back to the jest field of package.json', async () => {
		project({ files: { '/p/package.json': '{"jest":{"preset":"a-preset"}}' } })
		expect(await loadJestConfig('/p')).toEqual({ config: { preset: 'a-preset' }, from: 'package.json#jest' })
	})

	it('returns undefined when the project configures no jest', async () => {
		project({ files: { '/p/package.json': '{}' } })
		expect(await loadJestConfig('/p')).toBeUndefined()
	})

	it('takes a module without a default export as the config', async () => {
		project({ files: { '/p/package.json': '{}' }, modules: { '/p/jest.config.cjs': { preset: 'a-preset' } } })
		expect((await loadJestConfig('/p'))?.config).toEqual({ preset: 'a-preset' })
	})

	it('calls a config exported as a function', async () => {
		project({
			files: { '/p/package.json': '{}' },
			modules: { '/p/jest.config.mjs': { default: async () => ({ preset: 'a-preset' }) } },
		})
		expect((await loadJestConfig('/p'))?.config).toEqual({ preset: 'a-preset' })
	})
})

describe(`${loadPreset.name}()`, () => {
	it('loads a preset that resolves directly', async () => {
		project({
			resolved: { '@repobuddy/jest/presets/ts': '/n/ts/jest-preset.js' },
			modules: { '/n/ts/jest-preset.js': { default: { watchPlugins: ['jest-watch-suspend'] } } },
		})
		expect(await loadPreset('@repobuddy/jest/presets/ts', '/p')).toEqual({ watchPlugins: ['jest-watch-suspend'] })
	})

	it('falls back to the jest-preset.js inside the package', async () => {
		project({
			resolved: { 'a-preset/jest-preset.js': '/n/a-preset/jest-preset.js' },
			modules: { '/n/a-preset/jest-preset.js': { default: { testEnvironment: 'jsdom' } } },
		})
		expect(await loadPreset('a-preset', '/p')).toEqual({ testEnvironment: 'jsdom' })
	})

	it('falls back to a jest-preset.json inside the package', async () => {
		project({
			resolved: { 'a-preset/jest-preset.json': '/n/a-preset/jest-preset.json' },
			files: { '/n/a-preset/jest-preset.json': '{"testEnvironment":"jsdom"}' },
		})
		expect(await loadPreset('a-preset', '/p')).toEqual({ testEnvironment: 'jsdom' })
	})

	it('returns undefined when the preset does not resolve', async () => {
		project({})
		expect(await loadPreset('a-preset', '/p')).toBeUndefined()
	})

	it('returns undefined when the preset resolves but will not load', async () => {
		project({ resolved: { 'a-preset': '/n/a-preset/index.js' } })
		expect(await loadPreset('a-preset', '/p')).toBeUndefined()
	})
})
