import { resolve } from 'node:path'
import type { Config } from 'jest'
import { ctx } from './source.ctx.js'

/**
 * Configure the source directory of the project
 */
export function configSource(...dirs: string[]) {
	if (dirs.length === 0) {
		const dir = ['src', 'source', 'ts', 'js'].find((dir) => ctx.existsSync(resolve(dir))) ?? 'src'
		dirs = [dir]
	}
	return {
		collectCoverageFrom: dirs.flatMap((dir) => [
			`<rootDir>/${dir}/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}`,
			`!<rootDir>/${dir}/**/*.stories.*`,
		]),
		roots: dirs.map((dir) => `<rootDir>/${dir}`),
	} satisfies Config
}
