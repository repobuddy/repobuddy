/** @type {import('jest').Config} */
export default {
	preset: '@repobuddy/jest/presets/ts-watch',
	// bin.ts is pure process.argv → subcommand dispatch glue with no logic of its own (the mains it
	// calls are unit-tested directly in src/skills/*.spec.ts, and the dispatch itself is exercised
	// end-to-end by src/skills/bundles.spec.ts via the built CLI). Running it in-process would mean
	// re-parsing the real process.argv jest was invoked with, so it is excluded narrowly by file path.
	coveragePathIgnorePatterns: ['/node_modules/', '<rootDir>/src/bin.ts'],
}
