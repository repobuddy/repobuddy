---
"repobuddy": minor
---

`agent-readiness score` reports CI supply-chain settings in the `security` area: third-party actions pinned to a commit SHA, a `permissions:` block on every workflow or job, and a package-manager release-age gate. These checks never cap the level, and each hands its fix to `setup-github-repo` or `min-release-age`.
