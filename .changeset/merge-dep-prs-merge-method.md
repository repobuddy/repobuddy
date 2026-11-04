---
"repobuddy": patch
---

`merge-dep-prs` no longer hardcodes `--squash`. It merges through the repository's merge queue when there is one. Under GitHub's merge queue it runs `gh pr merge` with no method flag. Under a Mergify queue (a config file with `queue_rules`, or an active `Mergify Merge Queue` check) it comments `@mergifyio queue` instead of merging. A Mergify app with no queue counts as no queue, and if both queues are found it stops and reports. With no queue it picks a method the repository allows, preferring a merge commit. `--admin` is limited to a required check that can never report on the head commit, needs the user's approval, and uses the allowed method.
