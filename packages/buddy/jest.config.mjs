/** @type {import('jest').Config} */
export default {
	preset: '@repobuddy/jest/presets/ts-watch',
	// Skill script tests live outside `skills/` so `npx skills add` does not copy them to consumers.
	roots: ['<rootDir>/src', '<rootDir>/skills-test'],
	// Skill scripts are plain ESM run by node; transforming them to CommonJS breaks top-level await.
	transformIgnorePatterns: ['/node_modules/', '/skills/', '/skills-test/'],
}
