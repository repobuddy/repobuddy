---
"repobuddy": minor
---

`init-buddy` now records each run in a local, git-excluded `.agents/repobuddy/init-buddy.json`. It also hands the user a reminder line for `~/.agents/AGENTS.md`, limited to the owners they name; the skill never writes it. In a repo with no marker, the agent then mentions `init-buddy` once per session. A repo where the user declined stays quiet.
