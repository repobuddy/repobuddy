---
"repobuddy": patch
---

`setup-github-repo` says what to do when `release.yml` runs `changesets/action` in its own job instead of the shared release workflow: migrate to the shared workflow, or copy its approval step. Without one, the no-bypass merge backstop blocks the Version Packages PR, whose runs stay parked as `action_required`.
