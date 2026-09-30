---
"repobuddy": minor
---

`agent-readiness` `score` lists the prompt-injection surface as report-only facts: session-start and per-prompt hooks from Claude Code, Gemini CLI, Cursor, and Copilot settings with the command each runs, and the MCP servers declared in `.mcp.json`, `.cursor/mcp.json`, and `.vscode/mcp.json`. The agent judges which of them fetch untrusted content; none of them change the score.
