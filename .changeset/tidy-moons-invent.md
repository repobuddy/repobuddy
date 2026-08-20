---
'repobuddy': minor
---

Add the `review-permissions` skill: audit what an agent harness is allowed to do, rank each grant by what it actually permits, and propose a tighter, consolidated configuration.

It reads permissions across Claude Code, Cursor CLI, Codex CLI, Copilot CLI, Gemini CLI, and OpenCode — allowlists, approval modes, sandboxes, trusted folders, writable roots, hooks, and MCP servers — since an allowlist means nothing underneath a mode that skips the check. The bundled `scan-permissions.mjs` collects and grades; the skill supplies the repo context and never widens a grant or edits a config without an approved diff.
