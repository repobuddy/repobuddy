---
"repobuddy": minor
---

`review-permissions` places rules by permission mode. With `defaultMode: "auto"`, or `--mode auto` on the scanner, it flags allow rules for outward-facing commands (push, merge, `gh api`, `gh workflow run`, release, publish), which skip the auto-mode classifier; broad rules auto mode drops; an `autoMode` block in a project settings file, where the classifier ignores it; `soft_deny` or `hard_deny` lists without `"$defaults"`; and template text left in an `autoMode` entry. The scanner also ranks a `git stash *` allow rule as medium, because it admits `drop` and `clear` on a stash stack every worktree shares.
