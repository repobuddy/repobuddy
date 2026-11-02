/**
 * Deny entries from `skills/init-buddy/references/deny-list.md` (Entries, Claude Code) that more than
 * one script writes.
 *
 * Shared by `init-buddy`'s `permission-candidates` script, which proposes the deny list, and its
 * `auto-mode` script, which writes the entries each `autoMode.allow` rule needs beside it.
 */

/** A plain `--force` or `-f` before, between, or after the arguments, and a `+refspec`. */
export const FORCE_PUSH_DENY = [
	'Bash(git push --force *)',
	'Bash(git push -f *)',
	'Bash(git push * --force)',
	'Bash(git push * --force *)',
	'Bash(git push * -f)',
	'Bash(git push * -f *)',
	'Bash(git push * +*)',
]

/** `gh pr merge --admin`, which merges past the required checks. */
export const GITHUB_ADMIN_MERGE_DENY = ['Bash(gh pr merge --admin*)', 'Bash(gh pr merge * --admin*)']
