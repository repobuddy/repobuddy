import type { KnipConfig } from 'knip'

/**
 * One root knip run replaces the five per-package `depcheck` tasks and their
 * `.depcheckrc.yml` files.
 *
 * knip understands the pnpm workspace natively and covers everything depcheck
 * did (unused dependencies) plus what it could not see: unused files, unused
 * exports, and *missing* dependencies. It also covers `testcases/*` and
 * `examples/*`, which had no `depcheck` script at all and were therefore never
 * checked.
 *
 * On the hazard that matters here — this repo's product *is* its exports, and
 * nothing inside the repo imports most of them — knip needs no help. It reads
 * each package's `exports` map as entry points and follows every condition
 * target back to source, including all 77 of `@repobuddy/jest`'s. Nothing below
 * suppresses an export or an export-bearing file.
 *
 * Every `entry` here names a file that is genuinely reachable but not through
 * an import graph: a CLI script run by a shell, a lint fixture, a test file
 * whose suffix this repo defines itself. Every `ignoreDependencies` entry names
 * a package referenced somewhere static analysis cannot follow — a `declare
 * module` augmentation, a string in a jest config field, a `tsconfig` extends,
 * or `importHelpers` — and says which.
 */

/** Test-file suffixes this repo uses. `.spec` alone does not cover them. */
const testSuffixes = '{spec,test,unit,accept,integrate,system,perf,stress,study,learning}'
const extensions = '{ts,tsx,cts,mts,js,jsx,cjs,mjs}'

/**
 * Matches `foo.spec.ts` and the version-pinned `nodejs.spec.node18.ts` variants
 * the jest testcases use to pin a Node release.
 */
const testEntry = [`**/*.${testSuffixes}?(.node*).${extensions}`]

const config: KnipConfig = {
	workspaces: {
		'.': {
			entry: ['scripts/*.mjs'],
		},
		'packages/biome': {
			// Lint fixtures, not modules. `check:preset` runs biome over them, and
			// they are why `react`/`@types/react` are installed in this package.
			entry: ['tests/**/*.{ts,tsx}'],
			ignoreDependencies: [
				// tsconfig.json extends ../typescript/tsconfig/monorepo by relative
				// path, which knip cannot attribute back to the package.
				'@repobuddy/typescript',
			],
		},
		'packages/buddy': {
			entry: [
				'bin/*.js',
				'src/bin.ts',
				// Shipped skill scripts. Agents invoke these through a shell, so
				// nothing in the repo imports them.
				'skills/**/scripts/*.{mjs,mts}',
				...testEntry,
			],
		},
		'packages/jest': {
			entry: testEntry,
			ignoreDependencies: [
				// `declare module '@jest/expect'` in src/matchers/toSatisfies.ts —
				// a type augmentation, not an import.
				'@jest/expect',
				// Named as a string value in src/fields/moduleNameMapper.ts, which
				// jest resolves at runtime.
				'identity-obj-proxy',
			],
		},
		'packages/test': { entry: [...testEntry, '**/*.stories.tsx'] },
		'packages/typescript': { entry: testEntry },
		'packages/vitest': { entry: [...testEntry, '**/*.stories.tsx'] },
		'testcases/*': {
			// Fixture packages: the test files *are* the product. A runner executes
			// them; nothing imports them.
			entry: testEntry,
		},
		'testcases/build-ts': {
			entry: ['src/index.ts'],
			// tsconfig.tslib.json sets `importHelpers`, so tsc emits imports of it.
			ignoreDependencies: ['tslib'],
		},
		'testcases/jsdom-ts': {
			entry: testEntry,
			// The jsdom preset sets `testEnvironment: 'jsdom'`, which jest 30
			// resolves to this package from the test package's own node_modules.
			ignoreDependencies: ['jest-environment-jsdom'],
		},
		'testcases/ts-cjs': {
			entry: testEntry,
			// tsconfig.tslib.json sets `importHelpers`.
			ignoreDependencies: ['tslib'],
		},
	},
	ignore: [
		// plop templates: copied into a generated package, never executed here.
		'plops/**',
		// Fixtures that exist precisely because nothing imports them — they prove
		// the coverage reporters still count a non-spec source file.
		'**/not_a_spec.*',
	],
}

export default config
