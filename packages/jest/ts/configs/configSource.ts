import type { Config } from 'jest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Configure the source directory of the project
 */
export function configSource(...dirs: string[]) {
  if (dirs.length === 0) {
    const dir = ['src', 'source', 'ts', 'js'].find((dir) => existsSync(resolve(dir))) ?? 'src'
    dirs = [dir]
  }
  return {
    collectCoverageFrom: dirs.map((dir) => `<rootDir>/${dir}/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}`),
    roots: dirs.map((dir) => `<rootDir>/${dir}`)
  } satisfies Config
}
