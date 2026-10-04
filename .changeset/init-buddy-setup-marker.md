---
"repobuddy": minor
---

`init-buddy` now records each run in a local, git-excluded `.agents/repobuddy/init-buddy.json`. Once per machine, it offers to add a reminder line to the global instruction file (Claude Code, Codex, Gemini CLI), limited to the owners the user names. In a repo with no marker, the agent then mentions `init-buddy` once per session. A repo where the user declined stays quiet.
