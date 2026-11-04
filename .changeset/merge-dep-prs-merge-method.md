---
"repobuddy": patch
---

`merge-dep-prs` no longer hardcodes `--squash`. Under a merge queue it runs `gh pr merge` with no method flag, which enqueues the pull request. Otherwise it picks a method the repository allows, preferring a merge commit. `--admin` is limited to a required check that can never report on the head commit, needs the user's approval, and uses the allowed method.
