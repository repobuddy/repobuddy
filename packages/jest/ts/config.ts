import type { Config } from 'jest'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Configure the source directory of the project
 */
export function configSourceDir(dir?: string) {
  dir = ['src', 'source', 'ts', 'js'].find((dir) => existsSync(resolve(dir))) ?? 'src'
  return {
    collectCoverageFrom: [`<rootDir>/${dir}/**/*.{js,jsx,cjs,mjs,ts,tsx,cts,mts}`],
    roots: [`<rootDir>/${dir}`]
  } satisfies Config
}
