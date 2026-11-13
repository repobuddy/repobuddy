---
"repobuddy": minor
---

The `website` skill loads each command's instructions by name with the `reference` skill of `cyber-agentkit`: `website.init`, `website.deploy`, and a new `website.update` for changing an existing site. Each ships a default in the skill's `references/<name>.default.md`, so another plugin can ship its own version and a repository or user can override one section at a time without touching the skill. Without `cyber-agentkit`, the skill reads its bundled defaults.
