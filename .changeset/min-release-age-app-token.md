---
'repobuddy': minor
---

`min-release-age`: on GitHub, Setup CI now calls the shared `repobuddy/.github` `min-release-age.yml` workflow, which opens the restore PR with a `repobuddy` GitHub App token. Required checks run on that PR, and the repo needs no `MIN_RELEASE_AGE_TOKEN` secret and no copy of the script. Repos without the app keep the token-secret workflow, now shipped as `assets/ci/github-token.yml`.
