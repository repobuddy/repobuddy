---
'repobuddy': minor
---

Add `improve [area]` to the `agent-readiness` skill. It fixes the findings `score` reports one area per commit, applies each fix only after you approve it, hands fixes other skills own (`buddy-agent-harness`, `llms-txt`, `review-permissions`, `setup-github-repo`, `min-release-age`, `setup-npm-trusted-publishing`) to those skills, and re-runs `score` after each area to report how the level moved.
