export interface PresetOptions {
	/**
	 * Tell the preset to include general test files (platform agnostic tests).
	 *
	 * General test files are `*.spec,test,unit,accept,integrate,system,perf,stress,study}.extension`.
	 * e.g. `a.spec.ts`, `b.test.js`, `c.unit.tsx`.
	 */
	includeGeneralTests?: boolean | undefined
	/**
	 * Tell the preset to include load test files.
	 *
	 * Load test files are `*.load.extension`, e.g. `a.load.ts`, `b.load.js`.
	 *
	 * They are excluded by default because they are slow and are meant to be run
	 * on their own, not as part of a normal test run.
	 */
	includeLoadTests?: boolean | undefined
}
