/**
 * Finds a monorepo's workspace packages from `pnpm-workspace.yaml` or `package.json` `workspaces`, for
 * the checks that look inside each package rather than at the repo root.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** The repo's workspace package globs, from `pnpm-workspace.yaml` or `package.json` `workspaces`. */
export function workspaceGlobs(dir: string, workspaces: unknown): string[] {
	if (Array.isArray(workspaces)) return workspaces.filter((g) => typeof g === 'string')
	const packages = (workspaces as { packages?: unknown } | undefined)?.packages
	if (Array.isArray(packages)) return packages.filter((g) => typeof g === 'string')
	let yaml: string
	try {
		yaml = readFileSync(join(dir, 'pnpm-workspace.yaml'), 'utf8')
	} catch {
		return []
	}
	const globs: string[] = []
	let inPackages = false
	for (const line of yaml.split('\n')) {
		if (/^packages:/.test(line)) inPackages = true
		else if (/^\S/.test(line)) inPackages = false
		else if (inPackages) {
			const glob = /^\s+-\s+['"]?([^'"\s]+)['"]?/.exec(line)?.[1]
			if (glob) globs.push(glob)
		}
	}
	return globs
}

/**
 * Directories the globs name, relative to `dir`; only `dir/*` and literal paths, which is what
 * workspace globs use in practice.
 */
export function workspaceDirs(dir: string, globs: string[]): string[] {
	const excluded = new Set(globs.filter((g) => g.startsWith('!')).map((g) => trimSlash(g.slice(1))))
	return globs
		.filter((g) => !g.startsWith('!'))
		.flatMap((glob) => {
			const parent = /^(.+)\/\*$/.exec(glob)?.[1]
			if (!parent) return glob.includes('*') ? [] : [trimSlash(glob)]
			try {
				return readdirSync(join(dir, parent), { withFileTypes: true })
					.filter((e) => e.isDirectory())
					.map((e) => `${trimSlash(parent)}/${e.name}`)
			} catch {
				return []
			}
		})
		.filter((d) => !excluded.has(d))
}

function trimSlash(path: string): string {
	return path.replace(/^\.\//, '').replace(/\/$/, '')
}

export interface WorkspacePackage {
	/** Relative to the repo root, with `/` separators. */
	dir: string
	name: string
	private: boolean
}

/** Each workspace directory that holds a readable `package.json`. */
export function readWorkspacePackages(dir: string, workspaces: unknown): WorkspacePackage[] {
	return workspaceDirs(dir, workspaceGlobs(dir, workspaces)).flatMap((packageDir) => {
		try {
			const manifest = JSON.parse(readFileSync(join(dir, packageDir, 'package.json'), 'utf8'))
			const name = typeof manifest?.name === 'string' ? manifest.name : packageDir
			return [{ dir: packageDir, name, private: manifest?.private === true }]
		} catch {
			return []
		}
	})
}
