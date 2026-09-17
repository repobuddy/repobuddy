---
'repobuddy': minor
---

New `init-buddy` skill: gets a machine ready to work with the repository's git host.

It detects the OS and Linux family (Debian/Ubuntu, Fedora, RHEL-like, Arch, openSUSE, Alpine, NixOS), WSL,
`sudo` access, and the package managers on PATH. It then checks each host's CLI (`gh`, `glab`, `tea`, `fj`, or
`az` with the Azure DevOps extension) and lists the install commands that fit the machine, official
packages first. It also finds MCP servers already configured for the host across Claude Code (including
plugins), Cursor, Codex, Copilot CLI, Gemini CLI, VS Code, Windsurf, OpenCode, and Zed, reporting only
names, commands, and URL origins. When one is active, it asks whether the CLI is still wanted. Logins are
handed to the user to run.
