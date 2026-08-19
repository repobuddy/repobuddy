---
'repobuddy': minor
---

Ship the public agent skills as a universal plugin.

The five public skills (`create-issue`, `merge-dep-prs`, `setup-github-pages`, `setup-github-repo`,
`setup-npm-trusted-publishing`) move from the repository root into this package and are now published
in the npm tarball, alongside a canonical `plugin.json` on the Agent Plugins Specification v1.0.0 and
derived manifests for Claude Code, Cursor, and Codex. Copilot CLI reads the canonical manifest directly.
