---
"repobuddy": patch
---

Fix plugin version drift: `packages/buddy/plugin.json`, its vendor manifests, and both local marketplace catalogs were stuck at 1.3.2 while the package moved to 1.8.0, so `claude plugin update repobuddy@repobuddy` reported the plugin was already up to date and never installed the update. The root `version` script now carries a released version into the plugin automatically, and `pnpm verify` fails if it ever drifts again.
