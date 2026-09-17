---
"repobuddy": patch
---

`buddy --version` and `buddy --help` no longer print clibuilder's "no config found under ..." warning when run outside a repobuddy-configured repo. Config loading itself is unaffected: a `.repobuddy*` file (or a `repobuddy` key in `package.json`) still loads normally.
