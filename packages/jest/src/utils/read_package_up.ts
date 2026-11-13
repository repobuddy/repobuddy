import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'

export type PackageUpResult = { packageJson: Record<string, unknown>; path: string }

/**
 * Finds the nearest `package.json` at or above `cwd` and parses it.
 * Uses only `node:fs` so the presets stay loadable with `require`.
 */
export function readPackageUpSync(cwd: string = process.cwd()): PackageUpResult | undefined {
	let dir = resolve(cwd)
	for (;;) {
		const path = join(dir, 'package.json')
		let text: string | undefined
		try {
			text = readFileSync(path, 'utf8')
		} catch {}
		if (text !== undefined) return { packageJson: JSON.parse(text), path }
		const parent = dirname(dir)
		if (parent === dir) return undefined
		dir = parent
	}
}
