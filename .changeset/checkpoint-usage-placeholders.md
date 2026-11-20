---
"repobuddy": patch
---

`checkpoint` usage now writes placeholders as `<value>` (`resume [<slug> | <path> | <repo path>]`, `list [<repo path>]`, `create [<what to focus on>]`), so they no longer read as literal words to type; `--commit` and the subcommand names stay bare.
