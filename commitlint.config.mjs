/**
 * Conventional Commits, enforced by the `.husky/commit-msg` hook.
 *
 * The hook calls `node_modules/.bin/commitlint` directly rather than through
 * `pnpm exec`: under pnpm 11 a `pnpm exec` fired from inside a git hook prunes
 * `node_modules` and rewrites the lockfile, which leaves the tree dirty and
 * fails CI with ERR_PNPM_OUTDATED_LOCKFILE on the next run.
 */
export default {
	extends: ['@commitlint/config-conventional'],
	rules: {
		// AGENTS.md documents the set the repo uses; keep the two in step.
		'type-enum': [
			2,
			'always',
			['build', 'chore', 'ci', 'docs', 'feat', 'fix', 'perf', 'refactor', 'revert', 'style', 'test'],
		],
		// Changeset release commits ("Version Packages") and long explanatory
		// subjects are both fine; the default 100-char cap is not worth a fight.
		'header-max-length': [2, 'always', 120],
		'body-max-line-length': [0],
		'footer-max-line-length': [0],
	},
}
