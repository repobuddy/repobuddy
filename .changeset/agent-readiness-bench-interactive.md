---
"repobuddy": minor
---

`agent-readiness bench --runner interactive` runs each task as an interactive Claude Code session in a terminal multiplexer pane (tmux, herdr, or another one cyber-mux drives) instead of `claude -p`. Each session gets a fresh `CLAUDE_CONFIG_DIR`, so only the repository's own settings, instructions, skills, and `.mcp.json` load. It authenticates with `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY`. Tokens, turns, and tool calls come from the session transcript, and the cost from Claude Code's status line. The runner enforces `timeoutMinutes` and the per-run spend cap, and closes the pane and checkout after each run. Results record their runner, and a run is never compared against a baseline another runner took; a baseline with no runner counts as `print` (`claude -p`, still the default).
