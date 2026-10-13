---
"repobuddy": patch
---

`setup-github-repo`: use the current `gh repo edit` merge flags (`--enable-squash-merge`, `--enable-rebase-merge`), verify the settings through the REST API, drop the `"integration_id": null` that made the ruleset API reject required checks, and have the release job grant `actions: write` so the secretless release workflow can approve the Version Packages PR's parked runs under a no-bypass merge backstop.
