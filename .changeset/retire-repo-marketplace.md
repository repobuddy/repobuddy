---
"repobuddy": minor
---

Install the `repobuddy` plugin from `cyber-uni/marketplace`. This repository no longer carries its own marketplace catalogs (`.claude-plugin/marketplace.json`, `.github/plugin/marketplace.json`), so a harness that added `repobuddy/repobuddy` as a marketplace receives no update after this release. `cyber-uni/marketplace` also lists `cyber-agentkit`, the plugin `repobuddy` depends on.

To move, remove the old marketplace and add `cyber-uni/marketplace`:

```sh
# Claude Code
claude plugin uninstall repobuddy@repobuddy
claude plugin marketplace remove repobuddy
claude plugin marketplace add cyber-uni/marketplace
claude plugin install repobuddy@cyber-uni

# Codex
codex plugin remove repobuddy@repobuddy
codex plugin marketplace remove repobuddy
codex plugin marketplace add cyber-uni/marketplace
codex plugin add repobuddy@cyber-uni

# GitHub Copilot CLI
copilot plugin uninstall repobuddy@repobuddy
copilot plugin marketplace remove repobuddy
copilot plugin marketplace add cyber-uni/marketplace
copilot plugin install repobuddy@cyber-uni
```

On Cursor, a workspace admin removes the `repobuddy/repobuddy` team marketplace and imports `cyber-uni/marketplace` instead.
