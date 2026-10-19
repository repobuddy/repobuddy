---
"repobuddy": major
---

Rename the `session` skill to `checkpoint`, and its `pause` subcommand to `create`. Invoke `/checkpoint create`, `/checkpoint resume`, and `/checkpoint help` instead of `/session pause`, `/session resume`, and `/session help` (`$checkpoint` in Codex), and install it with `npx skills add repobuddy/repobuddy --skill checkpoint`. The old names are removed with no alias; natural phrasing such as "let's stop here" or "pick up X" still routes. Checkpoints stay in `.agents/repobuddy/checkpoints/` with the same format, so ones written by `session pause` resume unchanged.
