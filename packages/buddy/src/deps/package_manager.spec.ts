import { beforeEach, describe, expect, it } from '@jest/globals'
import { ctx } from './load_jest_config.ctx.js'
import { findPackageManager } from './package_manager.js'

const original = { ...ctx }

function files(entries: Record<string, string>) {
	ctx.existsSync = (path) => String(path) in entries
	ctx.readFile = (async (path: string) => {
		const content = entries[String(path)]
		if (content === undefined) throw new Error(`ENOENT: ${path}`)
		return content
	}) as typeof ctx.readFile
}

beforeEach(() => {
	Object.assign(ctx, original)
})

describe(`${findPackageManager.name}()`, () => {
	it('reads the field from the project itself', async () => {
		files({ '/w/p/package.json': '{"packageManager":"pnpm@12.3.4"}' })
		expect(await findPackageManager('/w/p')).toBe('pnpm@12.3.4')
	})

	it('falls back to an ancestor, which is where a monorepo declares it', async () => {
		files({ '/w/p/package.json': '{"name":"p"}', '/w/package.json': '{"packageManager":"pnpm@12.3.4"}' })
		expect(await findPackageManager('/w/p')).toBe('pnpm@12.3.4')
	})

	it('returns undefined when no ancestor declares one', async () => {
		files({ '/w/p/package.json': '{"name":"p"}' })
		expect(await findPackageManager('/w/p')).toBeUndefined()
	})

	it('keeps looking past a manifest it cannot parse', async () => {
		files({ '/w/p/package.json': 'not json', '/w/package.json': '{"packageManager":"yarn@4.0.0"}' })
		expect(await findPackageManager('/w/p')).toBe('yarn@4.0.0')
	})
})
