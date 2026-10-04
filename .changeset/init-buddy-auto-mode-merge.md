---
"repobuddy": minor
---

`init-buddy`'s advanced tier now offers a rule for merging in Claude Code auto mode. Auto mode's classifier blocks `gh pr merge` on a PR with no approving review even when `permissions.allow` lists the command. The new rule goes in `autoMode.allow` in `~/.claude/settings.json` (the classifier ignores project settings). It covers only the owners the user names and only PRs the agent has confirmed have no conflicts, green checks and no requested changes, never `--admin`. The `--admin` deny entries are written with it.
