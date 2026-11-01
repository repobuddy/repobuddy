---
"@repobuddy/typescript": patch
---

Move `clibuilder` from `dependencies` to `peerDependencies` (`^12.1.0`), so the plugin uses the `clibuilder` of the `repobuddy` CLI that loads it instead of always installing a private copy.
