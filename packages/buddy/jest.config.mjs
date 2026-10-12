/** @type {import('jest').Config} */
export default {
	preset: '@repobuddy/jest/presets/ts-watch',
	// bin.ts is pure process.argv → subcommand dispatch glue with no logic of its own (the mains it
	// calls are unit-tested directly in src/skills/*.spec.ts, and the dispatch itself is exercised
	// end-to-end by src/skills/bundles.spec.ts via the built CLI). Running it in-process would mean
	// re-parsing the real process.argv jest was invoked with, so it is excluded narrowly by file path.
	//
	// check-format, question-path and scan-permissions run on import (they read process.argv and
	// exit), so they cannot be loaded in-process either. Specs run their compiled bundles in a child
	// process instead.
	coveragePathIgnorePatterns: [
		'/node_modules/',
		'<rootDir>/src/bin.ts',
		'<rootDir>/src/skills/(check-format|question-path|scan-permissions).ts',
	],
}
