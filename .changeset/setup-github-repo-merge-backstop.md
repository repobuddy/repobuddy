---
'repobuddy': minor
---

`setup-github-repo` now reports whether the default branch has a merge backstop (a GitHub merge queue, a rule requiring the branch to be up to date, or a third-party queue such as Mergify) and, when it has none, offers a `merge-backstop` ruleset with no bypass actors, so every merge, including one an agent runs, is tested against the latest default branch. `detect-state` records the backstop and the workflows that trigger on `merge_group`, and the scaffolded `pull-request.yml` now triggers on `merge_group`.
