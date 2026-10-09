---
"repobuddy": patch
---

Fix skill errors found by a prompt audit: `setup-github-repo` no longer adds the Triage role (id 2) as a ruleset bypass actor and drops Node 20 from the CI matrix, `llms-txt` points at `buddy-agent-harness:init-buddy-agent-harness`, `setup-npm-trusted-publishing` names the right step, pinned `repobuddy` ranges are `^2.1.0`, and dated or migration-relative wording is removed.
