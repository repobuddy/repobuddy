---
'repobuddy': patch
---

`init-buddy`'s MCP scan (`buddy env` / `detect-env.mjs`) now reads configured MCP servers through
`buddy-agent-harness`'s `listMcpServers` instead of its own duplicate JSONC/TOML parsing. Output stays
the same shape and covers the same sources — Claude Code (user/project/local/plugin), Cursor, Codex,
Copilot CLI, Gemini CLI, VS Code, Windsurf, OpenCode, and Zed — with one behavior change: an unreadable
config file is now silently skipped rather than reported as a `{ harness, scope, file, error }` entry,
and Windsurf's servers are now reported under the harness name `devin-desktop` (still called "Windsurf"
in the skill's docs) instead of `windsurf`.
