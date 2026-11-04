---
"repobuddy": minor
---

`setup-github-repo` follows the owner's repository baseline for merges. Step 2 keeps merge commits and turns squash and rebase merges off. The merge backstop goes in the default-branch ruleset, where Administrators can bypass it, instead of a separate no-bypass `merge-backstop` ruleset. The merge queue merges one pull request at a time with a merge commit (`MERGE`, `max_entries_to_merge: 1`, `min_entries_to_merge_wait_minutes: 5`). detect-state reports the new targets and offers to fold a separate backstop ruleset into the default-branch one, and the scaffolded Dependabot auto-merge workflow merges with `--merge`.
