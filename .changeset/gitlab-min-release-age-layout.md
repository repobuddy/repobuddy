---
'repobuddy': minor
---

`min-release-age` Setup CI for GitLab asks for the runner image and the script path instead of hardcoding `node:22` and `ci/min-release-age.mjs`. `status --json` now reads `ci.script` (and, for GitLab, `ci.image`) back from an installed job, so a moved script or a mirrored image is reported correctly and kept on a re-run.
