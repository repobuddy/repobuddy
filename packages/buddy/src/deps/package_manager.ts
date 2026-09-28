import { dirname, join } from 'node:path'
import { ctx } from './load_jest_config.ctx.js'

/**
 * Find the `packageManager` that governs the project at `cwd`.
 *
 * Parent directories are searched too: in a monorepo the field sits on the
 * workspace root, and a suggestion to run `npm i -D` inside a pnpm workspace is
 * worse than no suggestion at all.
 *
 * Returns `undefined` when no ancestor declares one.
 */
export async function findPackageManager(cwd: string): Promise<string | undefined> {
	let dir = cwd
	for (;;) {
		const path = join(dir, 'package.json')
		if (ctx.existsSync(path)) {
			try {
				const manifest = JSON.parse((await ctx.readFile(path, 'utf-8')) as string) as { packageManager?: string }
				if (manifest.packageManager) return manifest.packageManager
			} catch {
				// An unreadable ancestor manifest is not this check's problem; the
				// one that matters is the project's own, read elsewhere.
			}
		}
		const parent = dirname(dir)
		if (parent === dir) return undefined
		dir = parent
	}
}
