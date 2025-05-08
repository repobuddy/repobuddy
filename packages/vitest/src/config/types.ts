export interface PresetOptions {
	/**
	 * Tell the preset to include general test files (platform agnostic tests).
	 *
	 * General test files are `*.spec,test,unit,accept,integrate,system,perf,stress,study}.extension`.
	 * e.g. `a.spec.ts`, `b.test.js`, `c.unit.tsx`.
	 */
	includeGeneralTests?: boolean | undefined
}
